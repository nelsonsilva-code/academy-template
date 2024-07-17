import {App, Duration} from "aws-cdk-lib";
import {Microservice} from "./microservice-interface";
import {AlarmsInterface, ApplicationProfile, EnvironmentStage} from "@pre-delivery-enrolment/cdk-commons";
import {IClusterEngine, IEngine} from "aws-cdk-lib/aws-rds";
import {InstanceClass, InstanceSize} from "aws-cdk-lib/aws-ec2";

interface BaseInterface{
    app: App
    env: {
        account: string,
        region: string,
    }
    microservice: Microservice
    ecrSuffix: string,
    githubSecretName: string,
    codestarProps: {
        owner: string,
        repo: string,
        connectionArn: string,
        branch: string,
        triggerOnPush: boolean,
    },
    allowedProxyPorts: number[],
    allowedProxySuffixes: string[],
    noProxySuffixes: string,
}

export interface DevelopmentInterface extends BaseInterface {
    stage: EnvironmentStage['stage']
    fargate: {
        fargateClusterName: string,
        fargateServiceName: string,
        fargateTaskDefinition: {
            cpu: number,
            memoryLimitMiB: number,
        },
        fargateHcPort: number,
        fargatePortMappings: number[],
        appProfile: ApplicationProfile['profile'],
        taskDesiredCount: number,
        addFargateMonitoring?: {
            cpu?: AlarmsInterface,
            memory?: AlarmsInterface,
            runningTasks?: AlarmsInterface,
        },
    }
    database?: {
        engine: IEngine,
        databaseEngine: IClusterEngine,
        databaseInstanceClass: InstanceClass,
        databaseInstanceSize: InstanceSize,
        databaseDeletionProtection: boolean
    }
    alarmTopicArn?: string
    sqs?: {
        maxReceiveCount: number,
        queueDelay?: Duration,
        addSqsMonitoring?: boolean
    },
}

export interface IntegrationInterface extends BaseInterface {
    stage: EnvironmentStage['stage']
    fargate: {
        fargateClusterName: string,
        fargateServiceName: string,
        fargateTaskDefinition: {
            cpu: number,
            memoryLimitMiB: number,
        },
        fargateHcPort: number,
        fargatePortMappings: number[],
        appProfile: ApplicationProfile['profile'],
        taskDesiredCount: number,
        addFargateMonitoring?: {
            cpu?: AlarmsInterface,
            memory?: AlarmsInterface,
            runningTasks?: AlarmsInterface,
        },
    }
    database?: {
        engine: IEngine,
        databaseEngine: IClusterEngine,
        databaseInstanceClass: InstanceClass,
        databaseInstanceSize: InstanceSize,
        databaseDeletionProtection: boolean
    }
    alarmTopicArn?: string
    sqs?: {
        maxReceiveCount: number,
        queueDelay?: Duration,
        addSqsMonitoring?: boolean
    }
}

export interface ProductionInterface extends BaseInterface {
    production: {
        stage: EnvironmentStage['stage']
        fargate: {
            fargateClusterName: string,
            fargateServiceName: string,
            fargateTaskDefinition: {
                cpu: number,
                memoryLimitMiB: number,
            },
            fargateHcPort: number,
            fargatePortMappings: number[],
            appProfile: ApplicationProfile['profile'],
            taskDesiredCount: number,
            addFargateMonitoring?: {
                cpu?: AlarmsInterface,
                memory?: AlarmsInterface,
                runningTasks?: AlarmsInterface,
            },
        },
        database?: {
            engine: IEngine,
            databaseEngine: IClusterEngine,
            databaseInstanceClass: InstanceClass,
            databaseInstanceSize: InstanceSize,
            databaseDeletionProtection: boolean
        }
        alarmTopicArn?: string
        sqs?: {
            maxReceiveCount: number,
            queueDelay?: Duration,
            addSqsMonitoring?: boolean
        }
    }
    prelive: {
        stage: EnvironmentStage['stage']
        fargate: {
            fargateClusterName: string,
            fargateServiceName: string,
            fargateTaskDefinition: {
                cpu: number,
                memoryLimitMiB: number,
            },
            fargateHcPort: number,
            fargatePortMappings: number[],
            appProfile: ApplicationProfile['profile'],
            taskDesiredCount: number,
            addFargateMonitoring?: {
                cpu?: AlarmsInterface,
                memory?: AlarmsInterface,
                runningTasks?: AlarmsInterface,
            },
        },
        database?: {
            engine: IEngine,
            databaseEngine: IClusterEngine,
            databaseInstanceClass: InstanceClass,
            databaseInstanceSize: InstanceSize,
            databaseDeletionProtection: boolean
        }
        alarmTopicArn?: string
        sqs?: {
            maxReceiveCount: number,
            queueDelay?: Duration,
            addSqsMonitoring?: boolean
        }
    }
}