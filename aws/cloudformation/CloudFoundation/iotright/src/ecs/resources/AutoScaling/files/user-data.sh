#!/usr/bin/env/bash -xe

# runs the CloudFormation::Init, which will copy the other required files into place
/opt/aws/bin/cfn-init -v --stack ${AWS::StackName} --resource ${WebLaunchConfig} --region ${AWS::Region}

echo ECS_CLUSTER=${ECSServiceCluster} >> /etc/ecs/ecs.config
echo ECS_RESERVED_MEMORY=256 >> /etc/ecs/ecs.config
yum install -y awslogs jq
# mv /etc/awslogs/awslogs.conf /etc/awslogs/awslogs.conf.bak #shouldnt need to do this, as the file is copied in via the launchconfig.js so should be in place


# cat our awslogs.conf, like cat > /etc/awslogs/awslogs.conf from our external file, but should be able to just copy it
# cp ./awslogs.conf /etc/awslogs/awslogs.conf again, shouldn't need to do this
# now just creating this file using cfn-init, from our template, so neither of these should be necessary

region=$(curl 169.254.169.254/latest/meta-data/placement/availability-zone | sed s'/.$//')
sed -i -e \"s/region = us-east-1/region = $region/g\" /etc/awslogs/awscli.conf # looks like this is making sure region is set
yum install -y https://amazon-ssm-$region.s3.amazonaws.com/latest/linux_amd64/amazon-ssm-agent.rpm
yum install -y aws-cfn-bootstrap

#getting a littl tricky here, this is the first attempt, just passing the stack ref from env var, like earlier?
# the $? is a variable for previous command output
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource $ {WebAutoscalingGroup} --region ${AWS::Region}


# NOTE: if neither of the two above work, then, damn...


script
  exec 2>>/var/log/ecs/cloudwatch-logs-start.log
  set -x
  until curl -s http://localhost:51678/v1/metadata
  do
    sleep 1
  done

  cluster=$(curl -s http://localhost:51678/v1/metadata | jq -r '. | .Cluster')
  container_instance_id=$(curl -s http://localhost:51678/v1/metadata | jq -r '. | .ContainerInstanceArn' | awk -F/ '{print $2}' )
  sed -i -e \"s/{cluster}/$cluster/g\" /etc/awslogs/awslogs.conf
  sed -i -e \"s/{container_instance_id}/$container_instance_id/g\" /etc/awslogs/awslogs.conf

  service awslogs start
  chkconfig awslogs on
end script

