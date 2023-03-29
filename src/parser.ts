export type Argument = {
  kind: "Argument";
  name: string;
  type_: string;
};

export type NeuroFunction = {
  kind: "NeuroFunction";
  name: string;
  args: Argument[];
  comment: string;
  returnType: string;
};

export type TypeDefinition = {
  kind: "TypeDefinition";
  body: string;
};

export type Construct = NeuroFunction | TypeDefinition;

export type Ok<value> = {
  kind: "Ok";
  value: value;
};

export type Err<error> = {
  kind: "Err";
  value: error;
};

export type ParsingResult<value, error> = Ok<value> | Err<error>;

function parseFunction(lines: string[]): ParsingResult<NeuroFunction, string> {
  const functionAndTypeLine = lines[0];

  let functionName = "";
  const maybeFunctionName = functionAndTypeLine.match(/function (.+)\(/);
  if (!maybeFunctionName) {
    return {
      kind: "Err",
      value: "Failed to find function name in " + functionAndTypeLine,
    };
  }
  functionName = maybeFunctionName[1];

  let args: Argument[] = [];
  const maybeArgs = functionAndTypeLine.match(/function .+\((.*)\)/);
  if (!maybeArgs) {
    return {
      kind: "Err",
      value: "Failed to find function arguments in " + functionAndTypeLine,
    };
  }
  args = maybeArgs[1]
    .trim()
    .split(",")
    .map((arg) => {
      const name = arg.split(":")[0];
      const type_ = arg.split(":")[1];

      return {
        kind: "Argument",
        name: name,
        type_: type_,
      };
    });

  let returnType = "void";
  const maybeReturnType = functionAndTypeLine.match(
    /function .+\(.*\): (.+) {/
  );
  if (maybeReturnType) {
    returnType = maybeReturnType[1];
  }

  const comments: string[] = [];
  for (const line of lines.slice(1, lines.length - 1)) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("//")) {
      comments.push(line);
    }
  }

  const comment = comments.join("\n");

  return {
    kind: "Ok",
    value: {
      kind: "NeuroFunction",
      name: functionName,
      args: args,
      comment: comment,
      returnType: returnType,
    },
  };
}

function parseTypeDefinition(
  lines: string[]
): ParsingResult<TypeDefinition, string> {
  return {
    kind: "Ok",
    value: {
      kind: "TypeDefinition",
      body: lines.join("\n"),
    },
  };
}

function findClosingBracket(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "}") {
      return i;
    }
  }

  return -1;
}

export type Program = {
  kind: "Program";
  blocks: Construct[];
};

export function parseFile(
  fileContents: string
): ParsingResult<Program, string> {
  const lines = fileContents.split("\n");
  const blocks: ParsingResult<Construct, string>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().length === 0) continue;

    if (line.startsWith("function")) {
      const endLineIndex = findClosingBracket(lines.slice(i, lines.length));

      if (endLineIndex === -1) {
        return {
          kind: "Err",
          value: "Failed to find closing bracket for function " + line,
        };
      } else {
        blocks.push(parseFunction(lines.slice(i, i + endLineIndex + 1)));
        i = i + endLineIndex + 1;
      }
    } else if (line.startsWith("type")) {
      const endLineIndex = findClosingBracket(lines.slice(i, lines.length));

      if (endLineIndex === -1) {
        return {
          kind: "Err",
          value: "Failed to find closing bracket for type definition " + line,
        };
      } else {
        blocks.push(parseTypeDefinition(lines.slice(i, i + endLineIndex + 1)));
        i = i + endLineIndex + 1;
      }
    }
  }

  if (blocks.filter((block) => block.kind === "Err").length > 0) {
    console.log(blocks);
    return {
      kind: "Err",
      value: blocks
        .filter((block) => block.kind === "Err")
        .map((block) => block.value)
        .join("\n"),
    };
  }

  return {
    kind: "Ok",
    value: {
      kind: "Program",
      blocks: blocks
        .filter((block) => block.kind === "Ok")
        .map((block) => (block as Ok<Construct>).value),
    },
  };
}
