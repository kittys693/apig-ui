from flask import Flask, render_template, jsonify, make_response, request
import kongconfig as config
import requests
import urllib3
from urllib.parse import urlparse
import json
import os
from jobQueue import readLocalJobsFile, readRunningJobsFile, readMicrofunctionsFile, restartFetcher


def getApigHost():
    try:
        apigHost = os.environ['APIG_SERVER']
    except:
        apigHost = "kong.healthpartners.com"
    return apigHost


app = Flask(__name__)
#############################
######## DOM OBJECTS ########
#############################

@app.route('/api/v1/queue', methods=['GET'])
def getQueue():
    try:
        """  Get jobQueue from Local pickle file"""
        queue = readLocalJobsFile()
        return make_response({'result': {'jobs': queue}}, 200)
    except:
        return make_response({'data': 'problem retrieving queue from picklefile'}, 500)

@app.route('/api/v1/getprocesslockstate', methods=['GET'])
def getProcessLockState():
    url = 'http://' + aseHost + '/api/v1/settings/processing'
    try:
        response = requests.request("GET", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
        if response.status_code != 500:
            return make_response(json.loads(response.text), 200)
        else:
            return make_response({'data': 'problem communicating with ase server'}, 500)
    except:
        return make_response({'data': 'problem communicating with ase server'}, 500)

##########################
######## SETTINGS ########
##########################

@app.route('/api/v1/getreviewmodelist', methods=['GET'])
def getReviewModeList():
    url = 'http://' + aseHost + '/api/v1/settings/review'
    try:
        response = requests.request("GET", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
        if response.status_code != 500:
            return make_response(json.loads(response.text), 200)
        else:
            return make_response({'data': 'problem communicating with ase server'}, 500)
    except:
        return make_response({'data': 'problem communicating with ase server'}, 500)

@app.route('/api/v1/jobs/addtoreviewmodelist/<mf>', methods=['GET'])
def addtoreviewmode(mf):
    url = 'http://' + aseHost + '/api/v1/settings/review?mf=' + mf + '&action=add'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    return json.loads(response.text)


@app.route('/api/v1/jobs/removefromreviewmodelist/<mf>', methods=['GET'])
def removefromreviewmode(mf):
    url = 'http://' + aseHost + '/api/v1/settings/review?mf=' + mf + '&action=remove'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    return json.loads(response.text)

#####################
######## JOB ########
#####################

@app.route('/api/v1/jobs/jids', methods=['GET'])
def getAllJidKeys():
# default to Kong when testing is done
    headers = {'apig-host': apigHost}
    url = 'http://kong:8000/jobs?action=allkeys'
    response = requests.request("GET", url, headers = headers)
    return json.loads(response.text)


@app.route('/api/v1/jobs/jids/<jid>', methods=['GET'])
def getJidInfo(jid):
    # default to Kong when testing is done
    headers = {'apig-host': apigHost}
    url = 'http://kong:8000/jobs?jid=' + jid
    try:
        response = requests.request("GET", url, headers = headers)
        if response.status_code != 500:
            return make_response(json.loads(response.text), 200)
        else:
            return make_response({'data': 'problem communicating with ase server'}, 500)
    except:
        return make_response({'data': 'problem communicating with ase server'}, 500)


@app.route('/api/v1/job/remove/<jid>', methods=['GET'])
def removeJob(jid):
    url = 'http://' + aseHost + '/api/v1/jobs/id/' + jid
    print(request.headers.environ['HTTP_X_HP_EMAIL'])
    response = requests.request("DELETE", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    """ update the pickle file with the latest jobQueue """
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)

@app.route('/api/v1/job/pause/<jid>', methods=['GET'])
def pauseJob(jid):
    url = 'http://' + aseHost + '/api/v1/jobs/id/' + jid + '?paused=true'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)

@app.route('/api/v1/job/resume/<jid>', methods=['GET'])
def resumeJob(jid):
    url = 'http://' + aseHost + '/api/v1/jobs/id/' + jid + '?paused=false'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)

@app.route('/api/v1/job/edit/<jid>', methods=['POST'])
def editJob(jid):
    url = 'http://kong:8000/jobs?jid=' + jid
    payload = request.data
    headers = {'Content-Type': 'application/json',  'apig-host': apigHost, 'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']}
    response = requests.request("POST", url, data=payload, headers = headers, verify=False)
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)

@app.route('/api/v1/job/approve/<jid>', methods=['GET'])
def approve(jid):
    url = 'http://' + aseHost + '/api/v1/jobs/id/' + jid + '?approved=true'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)


@app.route('/api/v1/job/resubmit/<jid>', methods=['POST'])
# TODO: Only allow resubmissions if the logged in user is the owner of the job
def resubmit(jid):
    path = request.json.get('path')
    method = request.json.get('method', 'POST')
    kongContainer = 'kong:8000'
    body = {
        'inputs': {
            'apig_jid': jid
        }
    }
    response = requests.request("POST", path.replace(apigHost, kongContainer).replace('https', 'http'), data=json.dumps(
        body), headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL'], 'Authorization': request.headers['X-RESUBMIT-AUTH']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)

##########################
######## ALL JOBS ########
##########################

@app.route('/api/v1/jobs/pause', methods=['GET'])
def pauseAll():
    url = 'http://' + aseHost + '/api/v1/jobs?paused=true'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)


@app.route('/api/v1/jobs/unpause', methods=['GET'])
def resumeAll():
    url = 'http://' + aseHost + '/api/v1/jobs?paused=false'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)


@app.route('/api/v1/jobs/remove', methods=['GET'])
def removeAll():
    url = 'http://' + aseHost + '/api/v1/jobs'
    response = requests.request("DELETE", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    if response.status_code == 200:
        restartFetcher()
    return json.loads(response.text)


@app.route('/api/v1/jobs/lockprocessing', methods=['GET'])
def lockprocessing():
    url = 'http://' + aseHost + '/api/v1/settings/processing?locked=true'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    return json.loads(response.text)


@app.route('/api/v1/jobs/unlockprocessing', methods=['GET'])
def unlockprocessing():
    url = 'http://' + aseHost + '/api/v1/settings/processing?locked=false'
    response = requests.request("POST", url, headers={'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']})
    return json.loads(response.text)

######################
######## SEARCH ######
######################
@app.route('/api/v1/search/', methods=['GET'])
def searchForJobs():
    filterDays = request.args.get('days', '7')
    filterStatus = request.args.get('status', 'successful')
    url = 'http://kong:8000/jobs/api/v1/search/?days=' + filterDays + '&status=' + filterStatus + '&server=' + apigHost
    response = requests.request("GET", url)
    jobsSearchList = response.text
    return jobsSearchList


@app.route('/api/v1/search/running/', methods=['GET'])
def getRunningJobsFromServer():
    jobs = readRunningJobsFile()
    return make_response({'result': {'jobs': jobs}}, 200)

###########################
##### MICROFUNCTIONS ######
###########################
@app.route('/api/v1/microfunctions/', methods=['GET'])
def getMicrofunctionsListFromServer():
    microfunctions = readMicrofunctionsFile()
    print(microfunctions)
    return make_response({'result': {'microfunctions': microfunctions}}, 200)


@app.route('/api/v1/microfunctions/<mf>', methods=['GET'])
def getMicrofunctionInfo(mf):
    url = 'http://kong:8000/jobs/api/v1/microfunction/' + mf

    response = requests.request("GET", url)
    mfData = json.loads(response.text)
    isOwner = False

    try:
        if request.headers.environ.get('HTTP_X_HP_EMAIL'):
            email = request.headers.environ.get('HTTP_X_HP_EMAIL') # RESTORE
            if email.lower() in mfData['configuration']['owners']:
                isOwner = True
    except:
        pass

    return make_response({'result': {'data': mfData, 'isOwner': isOwner}}, 200)

######################
######## MAIN ########
######################

@app.route("/")
def hello():

    if request.headers.environ.get('HTTP_X_HP_EMAIL'):
        headers = {'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']}
        hpUser = {
            'email': request.headers.environ['HTTP_X_HP_EMAIL'],
            'name': request.headers.environ['HTTP_X_HP_NAME'],
            'userId': request.headers.environ['HTTP_X_HP_UID']
        }
    else:
        headers = {'X-HP-Email': 'healthpartners@healthpartners.com'}
        hpUser = {
            'email': 'healthpartners@healthpartners.com',
            'name': 'Employee',
            'userId': 'a0000'
        }

    try:
        url = 'http://' + aseHost + '/api/v1/admins'
        response = requests.request("GET", url, headers=headers)
        if response.status_code == 200:
            return render_template('admin.html', hpUser=hpUser)
        elif response.status_code == 401:
            return render_template('index.html', hpUser=hpUser)
        else:
            return render_template('400.html'), 400
    except:
        # If ASE host is unreachable
        return render_template('index.html', hpUser=hpUser)


@app.route("/jobs/<jid>")
def job(jid):
    if request.headers.environ.get('HTTP_X_HP_EMAIL'):
        headers = {'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']}
        hpUser = {
            'email': request.headers.environ['HTTP_X_HP_EMAIL'],
            'name': request.headers.environ['HTTP_X_HP_NAME'],
            'userId': request.headers.environ['HTTP_X_HP_UID']
        }
    else:
        headers = {'X-HP-Email': 'healthpartners@healthpartners.com'}
        hpUser = {
            'email': 'healthpartners@healthpartners.com',
            'name': 'Employee',
            'userId': 'a0000'
        }
    return render_template('job.html', hpUser=hpUser, jid=jid)


@app.route("/microfunctions/<mf>")
def microfunction(mf):
    if request.headers.environ.get('HTTP_X_HP_EMAIL'):
        headers = {'X-HP-Email': request.headers.environ['HTTP_X_HP_EMAIL']}
        hpUser = {
            'email': request.headers.environ['HTTP_X_HP_EMAIL'],
            'name': request.headers.environ['HTTP_X_HP_NAME'],
            'userId': request.headers.environ['HTTP_X_HP_UID']
        }
    else:
        headers = {'X-HP-Email': 'healthpartners@healthpartners.com'}
        hpUser = {
            'email': 'healthpartners@healthpartners.com',
            'name': 'Employee',
            'userId': 'a0000'
        }
    return render_template('microfunction.html', hpUser=hpUser, microfunction=mf)

apigHost = getApigHost()
aseHost = "ase:5001"
restartFetcher()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)
