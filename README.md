# LangChain

<!--   Whole flow of integrating the LangChain AI project.   -->

1 Install Node.js (LTS)

LangChain TypeScript runs on Node.
Do this:
Go to 👉 https://nodejs.org

-> Verify installation:

Open Command Prompt / Terminal and run:
node -v
npm -v

2 Install VS Code

Go to https://code.visualstudio.com

Install these VS Code extensions (important):

Search and install:

TypeScript and JavaScript Language Features (usually built-in)
ESLint
Prettier

3 Create a folder name is LangChain and open this folder in VS code.
4 Open terninal and run

npm init -y

this create the folder 'package.json'

5 Install TypeScript & Node types

npm install -D typescript ts-node @types/node

6 Create folder 'tsconfig.json' run

npx tsc --init

7 Create folder structure

mkdir src

touch src/index.ts {if this command is not run, then you create file Index.ts manually in src folder}

8 Test TypeScript Setup

place 'console.log("TypeScript is working!");' in index.ts

9 Install LangChain (TypeScript)

npm install langchain @langchain/core

10 Install Ollama

Go to https://ollama.com

11 In PowerShell Run:

- Restart your terminal, or open the VS Code again
  ollama --version

12 Now test the service:

ollama list

13 Pull a Model (Very Important)

ollama pull llama3.1

# Test it:

ollama run llama3.1

Type: hello

Exit with:

/bye

14 Install Ollama adapter:

npm install @langchain/community
npm install @langchain/ollama

# Your First LangChain + Ollama Code

- Retart the TypeScrip Server

Do this:
Press Ctrl + Shift + P
Type: TypeScript: Restart TS Server
Hit Enter

15 Open tsconfig.json
Replace it completely with this (copy–paste):

{
"compilerOptions": {
"target": "ES2020",
"module": "NodeNext",
"moduleResolution": "NodeNext",
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"outDir": "dist",
"rootDir": "src",
"types": ["node"]
}
}

17 Fix package.json

{
"name": "langchain",
"version": "1.0.0",
"type": "module",
"scripts": {
"start": "ts-node src/index.ts"
}
}

Run project using command

npm run dev

"start": "ts-node src/index.ts"
change only the file name and hit run command.

# Join your agent with real database table {MSSQL}

1 Install SQL Server driver Run

    npm intsall mssql msnodesqlv8

    use it in production Run

    npm install --save-dev @types/mssql
