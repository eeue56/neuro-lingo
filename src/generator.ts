import { openai } from "./OpenAi";
import { Construct, NeuroFunction, Program, TypeDefinition } from "./parser";

function generateArg(name: string, type_: string): string {
  return `${name}: ${type_}`;
}

async function generateNeuroFunction(func: NeuroFunction): Promise<string> {
  const prompt = `Auto complete only the TypeScript function ${func.name} as purely plain TypeScript, no wrapping or explaining text. Only complete the function given and assume others are implemented. Do not wrap the code in markdown.`;
  const content = `
function ${func.name}(${func.args
    .map((arg) => generateArg(arg.name, arg.type_))
    .join(",")}): ${func.returnType || "void"} {
    // ${func.comment}
}
`;
  const completion = await openai.createChatCompletion({
    model: process.env.OPENAI_GPT_MODEL || "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: content },
    ],
    n: 3,
  });

  let message: string | undefined = completion.data.choices[0].message?.content;

  if (message?.startsWith("```")) {
    const lines = message.split("\n");
    message = lines.slice(1, lines.length - 1).join("\n");
  }

  return message || "";
}

async function generateTypeDefinition(
  typeDefinition: TypeDefinition
): Promise<string> {
  return typeDefinition.body;
}

async function generateConstruct(construct: Construct): Promise<string> {
  switch (construct.kind) {
    case "NeuroFunction": {
      return await generateNeuroFunction(construct);
    }
    case "TypeDefinition": {
      return await generateTypeDefinition(construct);
    }
  }
}

export async function generateProgram(program: Program): Promise<string> {
  let hasMain = false;
  const outBlocks: string[] = [];
  for (const block of program.blocks) {
    const generatedBlock = await generateConstruct(block);
    if (block.kind === "NeuroFunction" && block.name === "main") {
      hasMain = true;
    }
    outBlocks.push(generatedBlock);
  }

  if (hasMain) {
    outBlocks.push("main();");
  }

  const joinedBlocks = outBlocks.join("\n\n");

  return joinedBlocks;
}
