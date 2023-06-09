import {
  allErrors,
  bothFlag,
  empty,
  help,
  longFlag,
  parse,
  parser,
  string,
} from "@eeue56/baner";
import { spawnSync } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { generateProgram } from "./generator";
import { parseFile } from "./parser";

const cliParser = parser([
  longFlag("file", "The filename to compile ", string()),
  longFlag("quiet", "Avoid writing non-esstential output to terminal", empty()),
  longFlag("output", "An output file location", string()),
  bothFlag("h", "help", "This help text", empty()),
  longFlag("run", "Run the file after generating it", empty()),
]);

function runFile(fullName: string): void {
  let child;
  child = spawnSync(`npx`, [`ts-node`, `${fullName}`], {
    stdio: "inherit",
    encoding: "utf-8",
  });
}

async function main() {
  const cliProgram = parse(cliParser, process.argv);

  if (cliProgram.flags["h/help"].isPresent) {
    console.log(help(cliParser));
    return;
  }

  if (allErrors(cliProgram).length > 0) {
    console.log("Error");
    console.log(allErrors(cliProgram).join("\n"));
    return;
  }

  const fileNameFlag = cliProgram.flags["file"];

  if (!fileNameFlag.isPresent || fileNameFlag.arguments.kind === "Err") {
    console.error("Provide a filename to compile via --file");
    return;
  }

  const fileName: string = (fileNameFlag.arguments.value as string) || "";
  const providedOutputFileName =
    cliProgram.flags["output"].isPresent &&
    cliProgram.flags["output"].arguments.kind === "Ok"
      ? (cliProgram.flags["output"].arguments.value as string)
      : null;
  const outputFileName =
    providedOutputFileName === null
      ? "build/" + path.basename(fileName) + ".ts"
      : providedOutputFileName;

  const contents = await readFile(fileName, "utf-8");
  let generatedContents = "";
  try {
    if (outputFileName !== "/dev/stdout") {
      generatedContents = await readFile(outputFileName, "utf-8");
    }
  } catch (e) {}
  const program = parseFile(contents, generatedContents);

  //   if (2 > 1) return;

  if (program.kind === "Err") {
    console.log("Failed to parse program");
    console.error(program.value);
    return;
  }

  if (!cliProgram.flags["quiet"].isPresent) {
    console.log("Parsed successfully...");
    console.log("Generating code...");
  }

  try {
    await mkdir("build");
  } catch (e) {}
  const code = await generateProgram(program.value);

  if (!cliProgram.flags["quiet"].isPresent) {
    console.log("Writing to", outputFileName);
  }

  if (outputFileName === "/dev/stdout") {
    console.log(code);
  } else {
    await writeFile(`${outputFileName}`, code);
  }

  if (cliProgram.flags["run"].isPresent) {
    if (!cliProgram.flags["quiet"].isPresent) {
      console.log("Running program");
    }
    runFile(outputFileName);
  }
}

main();
