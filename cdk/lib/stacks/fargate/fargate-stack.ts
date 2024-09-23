import {Construct} from 'constructs';
import {Duration, SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {IVpc} from "aws-cdk-lib/aws-ec2";
import {CfnProxyCredentials,} from "@vw-sre/vws-cdk";
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {
    AlarmsInterface,
    ApplicationProfile,
    CustomFargate,
    EnvironmentStage, Microservice
} from "@nelsonsilva-code/cdk-commons";
import {CpuArchitecture, OperatingSystemFamily} from "aws-cdk-lib/aws-ecs";
import {DatabaseInstance, IDatabaseCluster} from "aws-cdk-lib/aws-rds";
import {ISecret, Secret} from "aws-cdk-lib/aws-secretsmanager";


interface FargateProps extends StackProps{
    taskDesiredCount: number;
    containerName: string,
    stackProps: StackProps,
    stackName: string,
    stage: EnvironmentStage['stage'],
    microservice: Microservice,
    proxyCredentials: CfnProxyCredentials,
    noProxySuffixes?: string,
    taskDefinition: {
        cpu: number,
        memoryLimitMiB: number,
    },
    vpc: IVpc,
    ecrRepo:IRepository,
    profile: ApplicationProfile['profile'],
    fargateEnvironmentVariables?: {[p: string]: string},
    env: {account: string, region: string}
    database?: DatabaseInstance | IDatabaseCluster,
    credentials?: ISecret
    fargateClusterName: string,
    fargateServiceName: string,
    fargateHcPort: number,
    fargatePortMappings: number[],
    addFargateMonitoring?: {
        cpu?: AlarmsInterface,
        memory?: AlarmsInterface,
        runningTasks?: AlarmsInterface,
    },
    topicArn?: string,
}

export class Fargate extends Stack {
    private fargate: CustomFargate
    constructor(scope: Construct, id: string, props: FargateProps) {
        super(scope, id, props);

        this.fargate = new CustomFargate(this, 'Fargate', {
            ...props,
            fargateCpuArchitecture: CpuArchitecture.X86_64,
            fargateOSFamily: OperatingSystemFamily.LINUX,
            healthCheck: {
                interval: Duration.seconds(300),
                path: '/actuator/health',
                port: props.fargateHcPort.toString(),
            },
            portMappings: props.fargatePortMappings,
            env: props.env,
            allowInternalConnections: true,
            rootReadOnly: true,
        })

        if (props.database && props.credentials) {
            this.fargate.allowConnectionToDatabase(Secret.fromSecretNameV2(this, 'DatabaseSecret', props.credentials.secretName!), props.database)
        }

        if (props.addFargateMonitoring?.cpu || props.addFargateMonitoring?.memory || props.addFargateMonitoring?.runningTasks) {
            if (!props.topicArn) {
                throw new Error('topicArn was not provided. This is mandatory when addFargateMonitoring is set to true.');
            }
            this.fargate.addMonitoring(props.topicArn,
                {addMonitor: props.addFargateMonitoring.cpu!.addMonitor},
                {addMonitor: props.addFargateMonitoring.memory!.addMonitor},
                {addMonitor: props.addFargateMonitoring.runningTasks!.addMonitor})
        }
    }
}