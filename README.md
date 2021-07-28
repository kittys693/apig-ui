- [API Gateway GUI](#api-gateway-gui)
- [Interactions](#interactions)
  * [Process Lock](#process-lock)
  * [Review Mode](#review-mode)
  * [Resubmit Jobs](#resubmit-jobs)
  * [Unpause All Jobs ](#unpause-alljobs)
  * [Pause All Jobs](#pause-all-jobs)
  * [Delete All Jobs](#delete-all-jobs)
  * [JOB Actions](#job-actions)
    + [Pause](#pause)
    + [Unpause](#unpause)
    + [Submit](#submit)
    + [Delete](#delete)
    + [Approve](#approve)
    + [Deny](#deny)
- [Quickstart Installation](#quickstart-installation)
- [Dependencies](#dependencies)

    
# API Gateway GUI

GUI for managing APIG platform.
All the pending jobs are fetched from  KONG and are added to a local file. The getQueue() retrieves the local file contents and diaplays on the page.
Any action performed on `job` or `jobs` are updated to the local file after interaction with ASE.

# Interactions
Only Admins can perform the interactions on the page and the Admins list is managed by `EMTECH` team.

## Process Lock
The *process lock* is a setting that allows or disallows jobs from  ASE.  
- If the process lock is unlocked, Job Lifecycle will continue as normal.
- If the process lock is locked, no Jobs will be submitted back to APIG unless explicitly `submitted` through `submit` button.
Only Admins can update the process lock.

## Review Mode
*Review Mode* is a list of micro functions that will automatically be given a Pause Constraint when created.  The purpose is to provide a processing filter on ASE without using the Process Lock on micro functions that require special attention.  
  
For instance, if the current Review Mode list includes `hello-world`, and a new job is submitted with the JID `hello-world-20191212-112105-6731`, it will be given a Pause constraint and remain in ASE until the contraint is removed by clicking on `unpause` of the job  or the Job is forcefully submitted through `submit` button.

## Resubmit Jobs
For any valid jid entered, it automatically picks up all the jidData and a popup window appears for resubmission of job.

## Unpause All Jobs 
Removes the `pause` constraint for  all the jobs in ASE

## Pause All Jobs
Adds the `pause` constraint for all jobs in ASE

## Delete All Jobs
Terminate all the jobs  in ASE.

## JOB Actions
Only `owners`  of the job id or the `admins` can perform the actions on the job.

### Pause
Adds a `pause` constraint for the selected job id.

### Unpause
Removes the `pause` constraint for the selected job id.

### Submit
Submit the job to Kong irrespective of the `constraints` and the `processlock`

### Delete
Terminate the selected job.

### Approve
This button is showed up if the jod id has a `approval` constraint to it. Check the prameters of job id and Approve  the job to reach KONG. 

### Deny
This button is showed up if the jod id has a `approval` constraint to it. Check the parameters of Job id and Deny the job. `Deny` terminates the job irrespective of constraints.

# Quickstart Installation
```
git clone https://gitlab.healthpartners.com/emtech/apig-admin-ui.git
cd apig-admin-ui
docker build -t apigui:latest .
docker run -d -p 3000 --network backend --name apigui --env "APIG_SERVER=kong.healthpartners.com" apigui:latest
```  

# Dependencies
```
pip install flask
pip install requests
pip install pyyaml
```
