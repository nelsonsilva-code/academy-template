# Academy Service Template

## Getting started

### Dependencies
You will need the following dependencies:
1. VWS2
2. Homebrew
3. Node

### Creating a Codestar Connection
Before deploying, you must create a codestar connection so AWS can retrieve code from your GitHub repository. To do so, please follow the steps bellow:
1. Go to **CodePipeline** -> **Settigs** -> **Connections** -> **Create Connection**;
2. Choose **GitHub** as your provider;
3. Give the connection a name (E.g.: Your GitHub username);
4. Press **Connect to Github**;
5. Press Install a new app and click on your github account. Leave the default settings and choose **Install**

### Deploying
1. Change the lines with **TODO** annotation (Project name, owner and Codestar Connection) and push your changes; 
2. Run ```npx aws-cdk ls```. It will print out a list of stacks available in your project;
3. Deploy the VPC, ECR and Secret Stacks with ```npx aws-cdk deploy [stack name]```;
4. In AWS GUI, search in SecretManger for your secret (cdk.ts line 36), and change its value;
5. Deploy the CodePipeline Stack and let it run (it will fail on the last step);
6. When the pipeline fails on the last step, deploy the Fargate Stack;
7. You can now see your application running.
8. By changing your source code in your repo, the pipeline will trigger automatically and new changes will be deployed to your Fargate Instance

## Adding Resources
The CDK-Commons package contains more resources than the ones deployed by default.
If you want to add an RDS or SQS instance, add the following on the cdk/bin/cdk.ts file:

#### RDS
```Javascript
database: {
    databaseInstanceClass: InstanceClass.T4G,   // Mandatory
    databaseInstanceSize: InstanceSize.MEDIUM,  // Mandatory
    databaseEngine: 'AuroraMySql',              // Mandatory
    databaseDeletionProtection: false           // Optiona
}
```
#### SQS

````Javascript
sqs: {
    maxReceiveCount: 5,                 // Mandatory
    queueDelay: Duration.minutes(2),    // Optional
    fifo: true,                         // Optional
    addSqsMonitoring: true,             // Optional    
    queueName: 'SQS-Example'            // Optional
}
````

You can now deploy once again.


## Resources to change (for future use)

Bellow you can find a list of resources that have placeholder values or are simply missing, and that you should replace/create them:
- src folder (completely empty)
- Dockerfile (dummy file that logs the uptime every 2 minutes)
- README


## Future challenges

Why stop here? You can add more stuff to this project. Here are some ideas:
- Make your Fargate reachable from the outside (Hint: Check fargate-stack.ts for props in the constructs)
- Deploy a stack from your pipeline instead of updating ECS (Check [here](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline_actions.CloudFormationCreateUpdateStackAction.html) from some info)
- Deploy a new service and connect it to the first one (Hint: Check fargate-stack.ts again)