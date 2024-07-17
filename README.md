# PDE Microservice Template

## Getting started
### Deploying as-is

Run the deploy.sh script inside the cdk/bin folder. This will deploy the following resources:
 - CodePipeline
 - Fargate
 - ECR

```shell
  cd cdk/bin
  chmod +x ./deploy.sh
  ./deploy.sh 
   ```
### Adding resources

The CDK-Commons package created by the SRE team contains more resources than the ones deployed by default.
If you want to add an RDS or SQS instance, add the following on the cdk/bin/cdk.ts file:

#### RDS
```Javascript
database: {
    engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_3_05_2,}), // Mandatory
    databaseEngine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_05_2}), // Mandatory
    databaseDeletionProtection: false, // Mandatory
    databaseInstanceClass: InstanceClass.T4G, // Mandatory
    databaseInstanceSize: InstanceSize.MEDIUM, // Mandatory
}
```
#### SQS

````Javascript
sqs: {
    maxReceiveCount: 5, // Mandatory
    queueDelay: Duration.minutes(2), // Optional
    addSqsMonitoring: true, // Optional
}
````

You can now deploy using the script once again.

```shell
  cd cdk/bin
  chmod +x ./deploy.sh
  ./deploy.sh 
   ```


## Resources to change

Bellow you can find a list of resources that have placeholder values or are simply missing, and that you should replace/create them:
- src folder (completely empty)
- Dockerfile (dummy file that logs the uptime every 2 minutes)
- README
- build.gradle.kts (changed all values that are microservice specific)
- settings.gradle.kts (changed all values that are microservice specific)
- Makefile (changed all values that are microservice specific)
- sonar-project.properties (changed all values that are microservice specific)
- some git actions (changed all values that are microservice specific)