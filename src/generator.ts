import * as dotenv from "dotenv";
import { openai } from "./OpenAi";
import {
  Construct,
  NeuroFunction,
  PinnedNeuroFunction,
  Program,
  TypeDefinition,
  UnionTypeDefinition,
} from "./parser";

dotenv.config();

function generateArg(name: string, type_: string): string {
  return `${name}: ${type_}`;
}

function generateNeuroFunctionTypeSignature(func: NeuroFunction): string {
  if (func.args.length === 0) {
    return `function ${func.name}(): ${func.returnType || "void"} {
}`;
  }
  return `function ${func.name}(${func.args
    .map((arg) => generateArg(arg.name, arg.type_))
    .join(",")}): ${func.returnType || "void"} {
}`;
}

async function generateNeuroFunction(
  func: NeuroFunction,
  otherBlocks: Construct[]
): Promise<string> {
  const prompt = `Auto complete only the TypeScript function called ${func.name} as purely plain TypeScript, no wrapping or explaining text. Only complete the function given and assume others are implemented. Do not wrap the code in markdown. Do not explain the code. Only provide the code for the function ${func.name}. Do not provide the code for other functions or types. Start your response with \`\`\`typescript`;
  const content = `
function ${func.name}(${func.args
    .map((arg) => generateArg(arg.name, arg.type_))
    .join(",")}): ${func.returnType || "void"} {
    // ${func.comment}
}
`;

  const otherMessages: { role: "user"; content: string }[] = otherBlocks.map(
    (construct) => {
      switch (construct.kind) {
        case "NeuroFunction": {
          return {
            role: "user",
            content: generateNeuroFunctionTypeSignature(construct),
          };
        }
        case "PinnedNeuroFunction": {
          return {
            role: "user",
            content: construct.body,
          };
        }
        case "TypeDefinition": {
          return {
            role: "user",
            content: construct.body,
          };
        }
        case "UnionTypeDefinition": {
          return {
            role: "user",
            content: `
type ${construct.name} = ${construct.tags.join(" | ")};
            `.trim(),
          };
        }
      }
    }
  );

  const completion = await openai.createChatCompletion({
    model: process.env.OPENAI_GPT_MODEL || "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt },
      ...otherMessages,
      { role: "user", content: content },
    ],
    temperature: 1,
    n: 1,
  });

  let message: string | undefined = completion.data.choices[0].message?.content;

  if (message?.startsWith("```")) {
    const lines = message.split("\n");
    message = lines.slice(1, lines.length - 1).join("\n");
  }

  return message || "";
}

async function generatePinnedNeuroFunction(
  func: PinnedNeuroFunction,
  otherBlocks: Construct[]
): Promise<string> {
  return func.body;
}

async function generateTypeDefinition(
  typeDefinition: TypeDefinition
): Promise<string> {
  return typeDefinition.body;
}

async function generateUnionTypeDefinition(
  unionTypeDefinition: UnionTypeDefinition
): Promise<string> {
  return `
type ${unionTypeDefinition.name} = ${unionTypeDefinition.tags.join(" | ")};
  `.trim();
}

async function generateConstruct(
  construct: Construct,
  otherBlocks: Construct[]
): Promise<string> {
  switch (construct.kind) {
    case "NeuroFunction": {
      return await generateNeuroFunction(construct, otherBlocks);
    }
    case "PinnedNeuroFunction": {
      return await generatePinnedNeuroFunction(construct, otherBlocks);
    }
    case "TypeDefinition": {
      return await generateTypeDefinition(construct);
    }
    case "UnionTypeDefinition": {
      return await generateUnionTypeDefinition(construct);
    }
  }
}

export async function generateProgram(program: Program): Promise<string> {
  let hasMain = false;
  const outBlocks: string[] = [];
  let i = 0;
  for (const block of program.blocks) {
    const otherBlocks: Construct[] = [
      ...program.blocks.slice(0, i),
      ...program.blocks.slice(i + 1, program.blocks.length),
    ];
    const generatedBlock = await generateConstruct(block, otherBlocks);
    if (
      (block.kind === "NeuroFunction" ||
        block.kind === "PinnedNeuroFunction") &&
      block.name === "main"
    ) {
      hasMain = true;
    }
    outBlocks.push(generatedBlock);
    i++;
  }

  if (hasMain) {
    outBlocks.push("main();");
  }

  const joinedBlocks = outBlocks.join("\n\n");

  return joinedBlocks;
}
