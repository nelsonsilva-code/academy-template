import { ProductionCodepipelineStack} from "../pipeline/prod-codepipeline-stack";
import {PdeFargate} from "../fargate/pde-fargate";
import {
    CustomEcr,
    CustomRds, CustomSqs,
    CustomVpcStack,
} from "@pre-delivery-enrolment/cdk-commons";
import {ProductionInterface} from "../../interfaces/environment-interfaces";
import {Credentials, IDatabaseCluster} from "aws-cdk-lib/aws-rds";

export class ProductionResources {
    constructor(props: ProductionInterface) {
        const { ecrRepo } = new CustomEcr(props.app, `${props.microservice.name}-EcrStack`, {
            microservice: props.microservice,
            suffix: props.ecrSuffix,
            stackName: `${props.microservice.name}-EcrStack`,
            env: props.env,
        })

        ////Prelive
        {
            const { vpc, proxyCredentials } = new CustomVpcStack(props.app, `${props.microservice.name}-${props.prelive.stage}-VpcStack`, {
                stackName: `${props.microservice.name}-${props.prelive.stage}-VpcStack`,
                stage: props.prelive.stage,
                stackProps: props,
                env: props.env,
                allowedPorts: [443, 80],
                allowedSuffixes: props.allowedProxySuffixes,
            })

            let fargateEnvVars:  {[p: string]: string} = {}
            let databaseCredentials = {} as {database: IDatabaseCluster, credentials: Credentials}
            if (props.prelive.database) {
                const {
                    database: preliveDatabase,
                    credentials: preliveCredentials
                } = new CustomRds(props.app, `${props.microservice.name}-${props.prelive.stage}-RdsStack`, {
                    stage: props.prelive.stage,
                    vpc,
                    stackName: `${props.microservice.name}-${props.prelive.stage}-RdsStack`,
                    microservice: props.microservice,
                    stackProps: props,
                    databaseInstanceClass: props.prelive.database.databaseInstanceClass,
                    databaseInstanceSize: props.prelive.database.databaseInstanceSize,
                    deletionProtection: props.prelive.database.databaseDeletionProtection,
                    databaseName: props.microservice.name,
                    engine: props.prelive.database.engine,
                    clusterEngine: props.prelive.database.databaseEngine,
                    env: props.env,
                })
                databaseCredentials = {
                    database: preliveDatabase,
                    credentials: preliveCredentials
                }
                fargateEnvVars = {
                    instanceEndpoint: preliveDatabase.instanceEndpoints.toString(),
                    clusterEndpoint: preliveDatabase.clusterEndpoint.toString(),
                }
            }

            if (props.prelive.sqs) {
                const {queue, dlQueue} = new CustomSqs(props.app, `${props.microservice.name}-${props.prelive.stage}-SqsStack`, {
                    stackProps: props,
                    microservice: props.microservice,
                    stackName: `${props.microservice.name}-${props.prelive.stage}-SqsStack`,
                    stage: props.prelive.stage,
                    vpc,
                    maxReceiveCount: props.prelive.sqs.maxReceiveCount,
                    queueDelay: props.prelive.sqs.queueDelay,
                    env: props.env,
                    addMonitoring: props.prelive.sqs.addSqsMonitoring,
                    topicArn: props.prelive.alarmTopicArn
                })

                fargateEnvVars = {
                    ...fargateEnvVars,
                    queueName: queue.queueName,
                    dlqName: dlQueue.queueName,
                }
            }

            new PdeFargate(props.app, `${props.microservice.name}-${props.prelive.stage}-FargateStack`, {
                stackProps: props,
                stage: props.prelive.stage,
                profile: props.prelive.fargate.appProfile,
                stackName: `${props.microservice.name}-${props.prelive.stage}-FargateStack`,
                containerName: ecrRepo.repositoryName,
                proxyCredentials,
                noProxySuffixes: props.noProxySuffixes,
                microservice: props.microservice,
                taskDefinition: props.prelive.fargate.fargateTaskDefinition,
                vpc,
                ecrRepo,
                taskDesiredCount: props.prelive.fargate.taskDesiredCount,
                fargateEnvironmentVariables: {
                    ...fargateEnvVars
                },
                env: props.env,
                database: databaseCredentials.database,
                credentials: databaseCredentials.credentials,
                fargateClusterName: props.prelive.fargate.fargateClusterName,
                fargateServiceName: props.prelive.fargate.fargateServiceName,
                fargateHcPort: props.prelive.fargate.fargateHcPort,
                fargatePortMappings: props.prelive.fargate.fargatePortMappings,
                addFargateMonitoring: props.prelive.fargate.addFargateMonitoring,
                topicArn: props.prelive.alarmTopicArn
            })

        }
        ////Production
        {
            const { vpc, proxyCredentials } = new CustomVpcStack(props.app, `${props.microservice.name}-${props.production.stage}-VpcStack`, {
                stackName: `${props.microservice.name}-${props.production.stage}-VpcStack`,
                stage: props.production.stage,
                stackProps: props,
                env: props.env,
                allowedPorts: [443, 80],
                allowedSuffixes: props.allowedProxySuffixes,
            })

            let fargateEnvVars:  {[p: string]: string} = {}
            let databaseCredentials = {} as {database: IDatabaseCluster, credentials: Credentials}

            if (props.production.database) {
                const {
                    database: productionDatabase,
                    credentials: productionCredentials
                } = new CustomRds(props.app, `${props.microservice.name}-${props.production.stage}-RdsStack`, {
                    stage: props.production.stage,
                    vpc,
                    stackName: `${props.microservice.name}-${props.production.stage}-RdsStack`,
                    microservice: props.microservice,
                    stackProps: props,
                    databaseInstanceClass: props.production.database.databaseInstanceClass,
                    databaseInstanceSize: props.production.database.databaseInstanceSize,
                    deletionProtection: props.production.database.databaseDeletionProtection,
                    databaseName: props.microservice.name,
                    engine: props.production.database.engine,
                    clusterEngine: props.production.database.databaseEngine,
                    env: props.env,
                })
                databaseCredentials = {
                    database: productionDatabase,
                    credentials: productionCredentials
                }
                fargateEnvVars = {
                    instanceEndpoint: productionDatabase.instanceEndpoints.toString(),
                    clusterEndpoint: productionDatabase.clusterEndpoint.toString(),
                }
            }

            if (props.production.sqs) {
                const {queue, dlQueue} = new CustomSqs(props.app, `${props.microservice.name}-${props.production.stage}-SqsStack`, {
                    stackProps: props,
                    microservice: props.microservice,
                    stackName: `${props.microservice.name}-${props.production.stage}-SqsStack`,
                    stage: props.production.stage,
                    vpc,
                    maxReceiveCount: props.production.sqs.maxReceiveCount,
                    queueDelay: props.production.sqs.queueDelay,
                    env: props.env,
                    addMonitoring: props.production.sqs.addSqsMonitoring,
                    topicArn: props.production.alarmTopicArn
                })

                fargateEnvVars = {
                    ...fargateEnvVars,
                    queueName: queue.queueName,
                    dlqName: dlQueue.queueName,
                }
            }

            new PdeFargate(props.app, `${props.microservice.name}-${props.production.stage}-FargateStack`, {
                stackProps: props,
                stage: props.production.stage,
                profile: props.production.fargate.appProfile,
                stackName: `${props.microservice.name}-${props.production.stage}-FargateStack`,
                containerName: ecrRepo.repositoryName,
                proxyCredentials,
                noProxySuffixes: props.noProxySuffixes,
                microservice: props.microservice,
                taskDefinition: props.production.fargate.fargateTaskDefinition,
                vpc,
                ecrRepo,
                taskDesiredCount: props.production.fargate.taskDesiredCount,
                fargateEnvironmentVariables: {
                    ...fargateEnvVars
                },
                env: props.env,
                database: databaseCredentials.database,
                credentials: databaseCredentials.credentials,
                fargateClusterName: props.production.fargate.fargateClusterName,
                fargateServiceName: props.production.fargate.fargateServiceName,
                fargateHcPort: props.production.fargate.fargateHcPort,
                fargatePortMappings: props.production.fargate.fargatePortMappings,
                addFargateMonitoring: props.production.fargate.addFargateMonitoring,
                topicArn: props.production.alarmTopicArn
            })
        }

        new ProductionCodepipelineStack(props.app, `${props.microservice.name}-CodepipelineStack`, {
            stackProps: props,
            stage: props.production.stage,
            stackName: `${props.microservice.name}-CodepipelineStack`,
            ecrRepo,
            ...props
        });
    }
}