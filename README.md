# neuro-lingo

A language where you only implement comments and types, and let LLMs deal with the rest.

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
