# neuro-lingo

A language where you only implement comments and types, and let LLMs deal with the rest. LLMs don't always provide workable examples, so your comments need to really match what you're trying to implement.

## Filenames

Neuro files end with .neuro

## Hello world

```typescript
function main() {
  // Print "Hello World" to the console
}
```

when run produces

```
Hello World
```

## Adding two numbers

```typescript
function add(a: number, b: number): number {
  // Add two numbers together
}

function main() {
  // Print "Hello World" to the console
  // Print the result of add(2, 3)
}
```

when run produces

```
Hello World
5
```

## Types

```typescript
type Person = {
  name: string;
};
```

# Installing

Clone the repo and run ts-node src/cli.ts.

Create an .env file with your OPENAI_API_KEY.
You can also set OPENAI_GPT_MODEL to use an alternative model. The default is gpt-3.5-turbo.

## Using the CLI

```bash
  --file string:                The filename to compile
  --quiet :             Avoid writing non-esstential output to terminal
  -h, --help :          This help text
  --run :               Run the file after generating it
```

# Notes

You can modify the prompts in [src/generate.ts](src/generator.ts) to your liking - if you find a better one, please open a pull request.

neuro-lingo is absolutely not recommened for use in productiong. It is a thought exercise which just so happens to have a functioning compiler.
