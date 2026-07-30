const { Stack, aws_ecs, aws_logs, Duration, Fn, aws_ec2, aws_elasticloadbalancingv2, aws_ssm, aws_iam, aws_secretsmanager } = require('aws-cdk-lib');

const ECS_CLUSTER_NAME_EXPORT = 'SharedNotificationClusterName';

class NotificationFargateExpressApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);


      const taskDefinition = new aws_ecs.FargateTaskDefinition(
          this,
          "NotificationsApiTaskDefinition",
          {
              cpu: 512,            // 0.5 vCPU
              memoryLimitMiB: 1024 // 1 GB
          }
      );

      const RDSWriteReadCredentialsSecret = aws_secretsmanager.Secret.fromSecretCompleteArn(
          this,
          'RDSWriteReadCredentialsSecret',
          'arn:aws:secretsmanager:us-east-1:010273536955:secret:write_read_rds_db-IyAK3D'
      );

      taskDefinition.addToTaskRolePolicy(
          new aws_iam.PolicyStatement({
              actions: ['secretsmanager:GetSecretValue'],
              resources: [RDSWriteReadCredentialsSecret.secretArn],
          }),
      );

      const logGroup = new aws_logs.LogGroup(this, "NotificationsApiLogs", {
          retention: aws_logs.RetentionDays.ONE_WEEK,
          logGroupName: '/ecs/notification-fargate-express-api',
      });


      const container = taskDefinition.addContainer("ApiContainer", {
          image: aws_ecs.ContainerImage.fromAsset('.', { file: 'Dockerfile' }),

          logging: aws_ecs.LogDrivers.awsLogs({
              logGroup,
              streamPrefix: "notification-fargate-express-api",
          }),

          environment: {
          },

          // healthCheck: {
          //     command: [
          //         "CMD-SHELL",
          //         "curl -f http://localhost:3000/health || exit 1",
          //     ],
          //     interval: Duration.seconds(30),
          //     timeout: Duration.seconds(5),
          //     retries: 3,
          //     startPeriod:Duration.seconds(30),
          // },
      });


      container.addPortMappings({
          containerPort: 3030,
      });

      const vpc = aws_ec2.Vpc.fromLookup(this, 'Vpc', {
          vpcId: 'vpc-084bacc70db0dcefd',
      });

      const cluster = aws_ecs.Cluster.fromClusterAttributes(this, 'Cluster', {
          clusterName: Fn.importValue(ECS_CLUSTER_NAME_EXPORT),
          vpc,
          securityGroups: [],
      });


      const albSecurityGroupId = aws_ssm.StringParameter.valueForStringParameter(
          this,
          "/notifications/alb/security-group-id"
      );

      const albSecurityGroup = aws_ec2.SecurityGroup.fromSecurityGroupId(
          this,
          "AlbSecurityGroup",
          albSecurityGroupId
      );

      const serviceSecurityGroup = new aws_ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
          vpc,
          description: 'Security group for ecs fargate service tasks',
          allowAllOutbound: true,
      });

      serviceSecurityGroup.addIngressRule(
          albSecurityGroup,
          aws_ec2.Port.tcp(3030),
          "Allow HTTP from ALB"
      );


      const service = new aws_ecs.FargateService(this, "NotificationFargateExpressApiService", {
          cluster,

          taskDefinition,

          desiredCount: 0,

          securityGroups: [serviceSecurityGroup],

          vpcSubnets: {
              subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
      });



      const targetGroup = new aws_elasticloadbalancingv2.ApplicationTargetGroup(this, "TargetGroup", {
          vpc,
          port: 3030,
          protocol: aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
          targetType: aws_elasticloadbalancingv2.TargetType.IP,

          // healthCheck: {
          //     path: "/health",
          // },
      });

      service.attachToApplicationTargetGroup(targetGroup);



      const listenerArn = aws_ssm.StringParameter.valueForStringParameter(
          this,
          "/notifications/alb/listener/https/arn"
      );




      const listener = aws_elasticloadbalancingv2.ApplicationListener.fromApplicationListenerAttributes(
          this,
          "HttpsListener",
          {
              listenerArn,
              securityGroup: albSecurityGroup,
          }
      );

      listener.addTargetGroups("ConfigurationsRule", {
          priority: 10,
          conditions: [
              aws_elasticloadbalancingv2.ListenerCondition.pathPatterns([
                  "/configurations",
                  "/configurations/*",
              ]),
          ],
          targetGroups: [targetGroup],
      });



  }
}

module.exports = { NotificationFargateExpressApiStack };
