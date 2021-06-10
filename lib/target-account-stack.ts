import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Custom properties to accomodate list of code deployment buckets across different regions
 */
interface EnvProps extends cdk.StackProps{
  toolsAccountUserArn: string;
}

export class TargetAccountRolesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: EnvProps) {
    super(scope, id, props);

    // Create Cloudformation Execution Role
    const cfExecutionRole = new iam.Role(
      this,
      'GitActionsCFExecutionRole',
      {
        assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
        description: 'Role assumed by cloudformation service while creating the required resources',
        roleName: 'github-action-cfn-execution-role',
        inlinePolicies: {
          CFExecutionPolicy: new iam.PolicyDocument({
            assignSids: true,
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'iam:Get*',
                  'iam:List*',
                  'iam:*Role*',
                  'iam:CreatePolicy',
                  'iam:DeletePolicy',
                  'iam:*PolicyVersion*',
                  'iam:*InstanceProfile*'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new iam.PolicyStatement({
                actions: [
                  's3:Get*',
                  's3:List*',
                  's3:HeadBucket'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new iam.PolicyStatement({
                actions: [
                  'cloudformation:*',
                  'apigateway:*',
                  'lambda:*'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
            ]
          })
        }
      }
    )

    // Create a cross account role
    const crossAccountRole = new iam.Role(this, 'CrossAccountRole',{
        assumedBy: new iam.ArnPrincipal(String(props?.toolsAccountUserArn)),
        roleName: 'github-action-cross-account-role',
        inlinePolicies: {
          CrossAccountPolicy: new iam.PolicyDocument({
            assignSids: true,
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'iam:PassRole'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  cfExecutionRole.roleArn
                ]
              }),
              new iam.PolicyStatement({
                actions: [
                  's3:List*'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new iam.PolicyStatement({
                actions: [
                  's3:*'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  // This is staging bucket created by CDKToolkit stack when CDK app is bootstrapped
                  'arn:aws:s3:::cdk-hnb659fds-assets-*',
                  'arn:aws:s3:::cdk-hnb659fds-assets-*/*'
                ]
              }),
              new iam.PolicyStatement({
                actions: [
                  'cloudformation:*'
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                  '*'
                ]
              })
            ]
          })
        }
      }
    );

    // STS Session Tagging Permission
    const sessionTaggingPolicy = new iam.PolicyStatement()
    sessionTaggingPolicy.addPrincipals(new iam.ArnPrincipal(String(props?.toolsAccountUserArn)));
    sessionTaggingPolicy.addActions('sts:TagSession');
    sessionTaggingPolicy.effect = iam.Effect.ALLOW;
    crossAccountRole.assumeRolePolicy?.addStatements(sessionTaggingPolicy)

    /*********************************** List of Outputs ************************************/
    new cdk.CfnOutput(
      this,
      'CFExecutionRoleArn',
      {
        description: 'Cloudformation Execution Role ARN',
        exportName: 'GIT-ACTIONS-CF-EXECUTION-ROLE-ARN',
        value: cfExecutionRole.roleArn
      }
    )

    new cdk.CfnOutput(
      this,
      'CrossAccountRoleArn',
      {
        description: 'Cross Account Role ARN',
        exportName: 'GIT-ACTIONS-CROSS-ACCOUNT-ROLE-ARN',
        value: crossAccountRole.roleArn
      }
    )
    /****************************************************************************************/
  }
}