# LangChain
<!--   Whole flow of integrating the LangChain AI project.   -->

# -> Install Node.js (LTS)

LangChain TypeScript runs on Node.
Do this:
Go to 👉 https://nodejs.org

# -> Verify installation:

Open Command Prompt / Terminal and run:
node -v
npm -v

# -> Install VS Code

Go to https://code.visualstudio.com

Install these VS Code extensions (important):

Search and install:

TypeScript and JavaScript Language Features (usually built-in)
ESLint
Prettier

# -> Create a folder name is LangChain and open this folder in VS code.
# -> Open terninal and run

npm init -y

this create the folder 'package.json'

# -> Install TypeScript & Node types

npm install -D typescript ts-node @types/node

# -> Create folder 'tsconfig.json' run 

npx tsc --init

# -> Create folder structure

mkdir src

touch src/index.ts {if this command is not run, then you create file Index.ts manually in src folder}

# -> Test TypeScript Setup

place 'console.log("TypeScript is working!");' in index.ts

# -> Install LangChain (TypeScript)

npm install langchain @langchain/core

# -> Install Ollama

Go to https://ollama.com

# -> In PowerShell Run:

<!-- 
Restart your terminal, or open the VS Code again
 -->
ollama --version

# -> Now test the service:

ollama list

# -> Pull a Model (Very Important)

ollama pull llama3.1

# Test it:

ollama run llama3.1

<!-- 
Type:  hello

Exit with:

/bye 
-->
# -> Install Ollama adapter:

npm install @langchain/community
npm install @langchain/ollama

#                                  Your First LangChain + Ollama Code

<!-- 
Retart the TypeScrip Server 
-->
Do this:
Press Ctrl + Shift + P
Type: TypeScript: Restart TS Server
Hit Enter

# -> Open tsconfig.json
Replace it completely with this (copy–paste):

<!-- 

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

 -->

 # -> Fix package.json

 <!--
 {
  "name": "langchain",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "ts-node src/index.ts"
  }
}
  -->
  Run project using command
 #   npm run dev
 <!-- 
 "start": "ts-node src/index.ts"
 change only the file name and hit run command.
  -->