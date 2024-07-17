import { IVpc} from "aws-cdk-lib/aws-ec2";

export interface Microservice{
    secretManagerName: string;
    name: string;
    vpc: IVpc,
    gitRepo: string,
    gitOwner: string,
}