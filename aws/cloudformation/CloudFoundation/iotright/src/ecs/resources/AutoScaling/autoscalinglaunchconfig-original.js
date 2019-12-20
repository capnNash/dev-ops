// const fs = require('fs')

// const userData = fs.readFileSync(`${__dirname}/../files/user-data.sh`, 'utf-8')
// const awscliConf = fs.readFileSync(`${__dirname}/../files/awscli.conf`, 'utf-8')
// const awslogsConf = fs.readFileSync(`${__dirname}/../files/awslogs.conf`, 'utf-8')
// const cfnHupConf = fs.readFileSync(`${__dirname}/../files/cfn-hup.conf`, 'utf-8')
// const cfnAutoReloaderConf = fs.readFileSync(`${__dirname}/../files/cfn-auto-reloader.conf`, 'utf-8')
//
//
module.exports = {
  "WebLaunchConfig": {
    "Type":"AWS::AutoScaling::LaunchConfiguration",
    "Properties": {
      "ImageId": {
        "Fn::FindInMap": [
          "AWSRegionECSAMI",
          {
            "Ref": "AWS::Region"
          },
          "ID"
        ]
      },
      "InstanceType": {
        "Ref": "WebInstanceType"
      },
      "IamInstanceProfile": {
        "Ref": "WebInstanceProfile"
      },
      "SecurityGroups": [
        {
          "Ref": "CloudInstanceSecurityGroup"
        }
      ],
      "KeyName": {
        "Ref": "KeyPairName"
      },
      "UserData": {
        "Fn::Base64": {
          "Fn::Join": [
            "",
            [
              "Content-Type: multipart/mixed; boundary=\"==BOUNDARY==\"\n",
              "MIME-Version: 1.0\n",
              "\n",
              "--==BOUNDARY==\n",
              "MIME-Version: 1.0\n",
              "Content-Type: text/x-shellscript; charset=\"us-ascii\"\n",
              "#!/usr/bin/env bash\n",
              "\n",
              "echo ECS_CLUSTER=",
              {
                "Ref":"ECSServiceCluster"
              },
              " >> /etc/ecs/ecs.config\n",

              "echo ECS_RESERVED_MEMORY=256 >> /etc/ecs/ecs.config\n",

              "yum install -y awslogs jq\n",
              "mv /etc/awslogs/awslogs.conf /etc/awslogs/awslogs.conf.bak\n",
              "cat > /etc/awslogs/awslogs.conf <<- EOF\n",
              "[general]\n",
              "state_file = /var/lib/awslogs/agent-state\n",
              "\n",
              "[/var/log/dmesg]\n",
              "file = /var/log/dmesg\n",
              "log_group_name = /var/log/dmesg\n",
              "log_stream_name = {cluster}/{container_instance_id}\n",
              "\n",
              "[/var/log/messages]\n",
              "file = /var/log/messages\n",
              "log_group_name = /var/log/messages\n",
              "log_stream_name = {cluster}/{container_instance_id}\n",
              "datetime_format = %b %d %H:%M:%S\n",
              "\n",
              "[/var/log/docker]\n",
              "file = /var/log/docker\n",
              "log_group_name = /var/log/docker\n",
              "log_stream_name = {cluster}/{container_instance_id}\n",
              "datetime_format = %Y-%m-%dT%H:%M:%S.%f\n",
              "\n",
              "[/var/log/ecs/ecs-init.log]\n",
              "file = /var/log/ecs/ecs-init.log.*\n",
              "log_group_name = /var/log/ecs/ecs-init.log\n",
              "log_stream_name = {cluster}/{container_instance_id}\n",
              "datetime_format = %Y-%m-%dT%H:%M:%SZ\n",
              "\n",
              "[/var/log/ecs/ecs-agent.log]\n",
              "file = /var/log/ecs/ecs-agent.log.*\n",
              "log_group_name = /var/log/ecs/ecs-agent.log\n",
              "log_stream_name = {cluster}/{container_instance_id}\n",
              "datetime_format = %Y-%m-%dT%H:%M:%SZ\n",
              "\n",
              "[/var/log/ecs/audit.log]\n",
              "file = /var/log/ecs/audit.log.*\n",
              "log_group_name = /var/log/ecs/audit.log\n",
              "log_stream_name = {cluster}/{container_instance_id}\n",
              "datetime_format = %Y-%m-%dT%H:%M:%SZ\n",
              "\n",
              "[/var/log/puma/puma.log]\n",
              "file = /var/log/puma/puma.log.*\n",
              "log_group_name = WebService\n",
              "log_stream_name = WebTask-{cluster}/{container_instance_id}\n",
              "datetime_format = %Y-%m-%dT%H:%M:%SZ\n",
              "batch_count = 10000",
              "buffer_duration = 10000",
              "\n",
              "EOF\n",
              "\n",
              "region=$(curl 169.254.169.254/latest/meta-data/placement/availability-zone | sed s'/.$//')\n",
              "sed -i -e \"s/region = us-east-1/region = $region/g\" /etc/awslogs/awscli.conf\n",
              "\n",
              "yum install -y https://amazon-ssm-$region.s3.amazonaws.com/latest/linux_amd64/amazon-ssm-agent.rpm\n",
              "\n",
              "yum install -y aws-cfn-bootstrap\n",
              "/opt/aws/bin/cfn-signal -e $? ",
              "         --stack ",
              {
                "Ref":"AWS::StackName"
              },
              "         --resource WebAutoscalingGroup ",
              "         --region ",
              {
                "Ref":"AWS::Region"
              },
              "\n",
              "--==BOUNDARY==\n",
              "MIME-Version: 1.0\n",
              "Content-Type: text/upstart-job; charset=\"us-ascii\"\n",
              "\n",
              "#upstart-job\n",
              "description \"Configure and start CloudWatch Logs agent on Amazon ECS container instance\"\n",
              "author \"Amazon Web Services\"\n",
              "start on started ecs\n",
              "\n",
              "script\n",
              "  exec 2>>/var/log/ecs/cloudwatch-logs-start.log\n",
              "  set -x\n",
              "  \n",
              "  until curl -s http://localhost:51678/v1/metadata\n",
              "  do\n",
              "    sleep 1 \n",
              "  done\n",
              "  \n",
              "  cluster=$(curl -s http://localhost:51678/v1/metadata | jq -r '. | .Cluster')\n",
              "  container_instance_id=$(curl -s http://localhost:51678/v1/metadata | jq -r '. | .ContainerInstanceArn' | awk -F/ '{print $2}' )\n",
              "  sed -i -e \"s/{cluster}/$cluster/g\" /etc/awslogs/awslogs.conf\n",
              "  sed -i -e \"s/{container_instance_id}/$container_instance_id/g\" /etc/awslogs/awslogs.conf\n",
              "  \n",
              "  service awslogs start\n",
              "  chkconfig awslogs on\n",
              "end script\n",
              "--==BOUNDARY==--\n"
            ]
          ]
        }
      }
    }
  }
}