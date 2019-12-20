const fs = require('fs')

const userData = fs.readFileSync(`${__dirname}/../files/user-data.sh`, 'utf-8')
const awscliConf = fs.readFileSync(`${__dirname}/../files/awscli.conf`, 'utf-8')
const awslogsConf = fs.readFileSync(`${__dirname}/../files/awslogs.conf`, 'utf-8')
const cfnHupConf = fs.readFileSync(`${__dirname}/../files/cfn-hup.conf`, 'utf-8')
const cfnAutoReloaderConf = fs.readFileSync(`${__dirname}/../files/cfn-auto-reloader.conf`, 'utf-8')


module.exports = {
  "WebLaunchConfig": {
    "Type":"AWS::AutoScaling::LaunchConfiguration",
    "Metadata": {
          "AWS::CloudFormation::Init": {
              "configSets": {
                  "default": ["tools", "autoupdate"]
              },
              "tools": {
                  "files": {
                      "/etc/awslogs/awscli.conf": {
                          "content": {
                              "Fn::Sub": awscliConf
                          },
                          "mode": "000644",
                          "owner": "root",
                          "group": "root"
                      },
                      "/etc/awslogs/awslogs.conf": {
                          "content": {
                              "Fn::Sub": awslogsConf
                          },
                          "mode": "000644",
                          "owner": "root",
                          "group": "root"
                      }
                  }
              },
              "autoupdate": {
                  "files": {
                      "/etc/cfn/cfn-hup.conf": {
                          "content": {
                              "Fn::Sub": cfnHupConf
                          },
                          "mode": "000400",
                          "owner": "root",
                          "group": "root"
                      },
                      "/etc/cfn/hooks.d/cfn-auto-reloader.conf": {
                          "content": {
                              "Fn::Sub": cfnAutoReloaderConf
                          }
                      }
                  },
                  "services": {
                      "sysvinit": {
                          "cfn-hup": {
                              "enabled": true,
                              "ensureRunning": true,
                              "files": [
                                  "/etc/cfn/cfn-hup.conf",
                                  "/etc/cfn/hooks.d/cfn-auto-reloader.conf"
                              ]
                          }
                      }
                  }
              }
          }
      },
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
          "Fn::Sub": [
              userData
          ]
        }
      }
    }
  }
}