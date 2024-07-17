import {DevelopmentCodepipelineStack} from "../pipeline/development-codepipeline-stack";
import {
    CustomEcr,
    CustomRds, CustomSqs,
    CustomVpcStack,
} from "@pre-delivery-enrolment/cdk-commons";
import {PdeFargate} from "../fargate/pde-fargate";
import {DevelopmentInterface} from "../../interfaces/environment-interfaces";
import {Credentials, IDatabaseCluster} from "aws-cdk-lib/aws-rds";

export class DevelopmentResources {
    constructor(props: DevelopmentInterface) {
        const {vpc, proxyCredentials} = new CustomVpcStack(props.app, `${props.microservice.name}-${props.stage}-VpcStack`, {
            stackName: `${props.microservice.name}-${props.stage}-VpcStack`,
            stage: props.stage,
            stackProps: props,
            env: props.env,
            allowedPorts: [443, 80],
            allowedSuffixes: props.allowedProxySuffixes,
        })

        const {ecrRepo} = new CustomEcr(props.app, `${props.microservice.name}-${props.stage}-EcrStack`, {
            microservice: props.microservice,
            suffix: props.ecrSuffix,
            stackName: `${props.microservice.name}-${props.stage}-EcrStack`,
            env: props.env,
        })

        let fargateEnvVars:  {[p: string]: string} = {}
        let databaseCredentials = {} as {database: IDatabaseCluster, credentials: Credentials}

        if (props.database) {
            const {database, credentials} = new CustomRds(props.app, `${props.microservice.name}-${props.stage}-RdsStack`, {
                stage: props.stage,
                vpc,
                stackName: `${props.microservice.name}-${props.stage}-RdsStack`,
                microservice: props.microservice,
                stackProps: props,
                databaseInstanceClass: props.database.databaseInstanceClass,
                databaseInstanceSize: props.database.databaseInstanceSize,
                deletionProtection: props.database.databaseDeletionProtection,
                databaseName: props.microservice.name,
                engine: props.database.engine,
                clusterEngine: props.database.databaseEngine,
                env: props.env,
            })

            databaseCredentials = {
                database,
                credentials
            }
            fargateEnvVars = {
                instanceEndpoint: database.instanceEndpoints.toString(),
                clusterEndpoint: database.clusterEndpoint.toString(),
            }
        }

        if (props.sqs) {
            const {queue, dlQueue} = new CustomSqs(props.app, `${props.microservice.name}-${props.stage}-SqsStack`, {
                stackProps: props,
                microservice: props.microservice,
                stackName: `${props.microservice.name}-${props.stage}-SqsStack`,
                stage: props.stage,
                vpc,
                maxReceiveCount: props.sqs.maxReceiveCount,
                queueDelay: props.sqs.queueDelay,
                env: props.env,
                addMonitoring: props.sqs.addSqsMonitoring,
                topicArn: props.alarmTopicArn
            })

            fargateEnvVars = {
                ...fargateEnvVars,
                queueName: queue.queueName,
                dlqName: dlQueue.queueName,
            }
        }

        new DevelopmentCodepipelineStack(props.app, `${props.microservice.name}-${props.stage}-CodepipelineStack`, {
            stackProps: props,
            stackName: `${props.microservice.name}-${props.stage}-CodepipelineStack`,
            ecrRepo,
            ...props,
        });

        new PdeFargate(props.app, `${props.microservice.name}-${props.stage}-FargateStack`, {
            stackProps: props,
            stage: props.stage,
            profile: props.fargate.appProfile,
            stackName: `${props.microservice.name}-${props.stage}-FargateStack`,
            containerName: ecrRepo.repositoryName,
            proxyCredentials,
            noProxySuffixes: props.noProxySuffixes,
            microservice: props.microservice,
            taskDefinition: props.fargate.fargateTaskDefinition,
            vpc,
            ecrRepo,
            taskDesiredCount: props.fargate.taskDesiredCount,
            fargateEnvironmentVariables: {
                ...fargateEnvVars
            },
            env: props.env,
            database: databaseCredentials.database,
            credentials: databaseCredentials.credentials,
            fargateClusterName: props.fargate.fargateClusterName,
            fargateServiceName: props.fargate.fargateServiceName,
            fargateHcPort: props.fargate.fargateHcPort,
            fargatePortMappings: props.fargate.fargatePortMappings,
            addFargateMonitoring: props.fargate.addFargateMonitoring,
            topicArn: props.alarmTopicArn,
        })
    }
}