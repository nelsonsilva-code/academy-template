# Microservice CDK
First, make it sure that `bin` folder is not into `.gitignore`
## Bootstrap your environment

1. Get the credentials

   Go to the [Vanguard console](https://vwapps.cloud/) and dowload the credentials from `Projects` -> `Accounts` -> `select the one you want` -> Click `Download credentials`.

1. Load the credentials

   If it is your first time with infrastructure or you have a new 💻, go to [SRE GitHub](https://github.com/vw-sre/vws2-credentials-loader), clone this repo and follow its instructions.

   Once that is done, just do

   ```bash
   vws2
   ```

   This will load your credentials into your cli.

   Then, get back to the `cdk` folder for the next steps.

1. Login to SRE npm registry

   Just copy paste this code. One line at a time.

   ```bash
   export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain vw-sre --domain-owner 565220512126 --query authorizationToken --output text)

   npm config set @vw-sre:registry https://vw-sre-565220512126.d.codeartifact.eu-west-1.amazonaws.com/npm/vw-sre/

   npm config set //vw-sre-565220512126.d.codeartifact.eu-west-1.amazonaws.com/npm/vw-sre/:_authToken ${CODEARTIFACT_AUTH_TOKEN}
   ```

   Then your `npm i` should work flawlessly 😎 and you will be able to inspect SRE constructs 🕵🏻‍♀️ 🚧.

## Getting started
### Order to execute


1. Create 3 keys in Secret Manager `<secretManagerName>`: is the microservice variable created in `cdk.ts`
   1. `<secretManagerName>/develop` - In Development AWS
   2. `<secretManagerName>/prelive` - In Production AWS
   3. `<secretManagerName>/prod` - In Production AWS
2. Bootstrap Stack
3. ECR Stack
4. Pipeline Stack, wait until the Pipeline execution, it will break because there is no ECS created yet, no worries. It is just to deploy the image into ECR
5. Fargate stacks


### Commands
1. All cdk commands must be executed from the newly created folder

   ```shell
   cd infrastructure
   ```

1. Pre-bootstrap environment to avoid VWS Findings for using the AdministratorAccess policy

   ```shell
   npx cdk deploy BootstrapStack
   ```


1. Deploy one of the base stacks

   ```shell
   npx cdk deploy <StackName>
   ```

1. Create the [GitHub connection](https://eu-west-1.console.aws.amazon.com/codesuite/settings/connections?region=eu-west-1&connections-meta=eyJmIjp7InRleHQiOiIifSwicyI6e30sIm4iOjIwLCJpIjowfQ) for this repo.
   Note that this must be done by an admin of the [GitHub organization](https://github.com/pre-delivery-enrolment).

   