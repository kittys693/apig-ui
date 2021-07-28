# copy pending jobs queue to pickle file
import urllib3
import json
import time
import os
import pickle
import threading
from threading import Event
from threading import Thread

fetchingThreadName = "apig-fetch"

class FetchTask(Thread):
    
    def __init__(self):
        Thread.__init__(self)
        self._sleepperiod = 1
        self.runtime = 0
        self.name = fetchingThreadName
        self.daemon = True
        self.dead = False
    
    def stop(self):
        self.dead = True
    
    def stopped(self):
        return self.dead

    def run(self):
        while not self.stopped():
            if time.time() - self.runtime > 60:
                getJobsFromASE() # gets the job queue
                getRunningJobsFromPyjobs() # gets the running jobs list
                self.runtime = time.time()
            else:
                time.sleep(self._sleepperiod)

if not os.path.exists('/tmp/apigui'):
    os.makedirs('/tmp/apigui')

jobQueuePickleFile = os.path.join('/tmp/apigui', 'jobqueue.pkl')
runningJobsPickleFile = os.path.join('/tmp/apigui', 'runningjobs.pkl')
microfunctionsListPickleFile = os.path.join('/tmp/apigui', 'microfunctions.pkl')


def getApigHost():
    try:
        apigHost = os.environ['APIG_SERVER']
    except:
        apigHost = "kong.healthpartners.com"
    return apigHost

apigHost = getApigHost()

def readLocalJobsFile():
    """Unpickle the jobQueuePickleFile and return it as a dictionary."""
    try:
        f = open(jobQueuePickleFile, 'rb')
        jobQueue = pickle.load(f)
        f.close()
        return jobQueue
    except:
        return {}


def readRunningJobsFile():
    """Unpickle the runningJobsPickleFile and return it as a list."""
    try:
        f = open(runningJobsPickleFile, 'rb')
        runningJobsList = pickle.load(f)
        f.close()
        return runningJobsList
    except:
        return []

def readMicrofunctionsFile():
    """Unpickle the runningJobsPickleFile and return it as a list."""
    try:
        f = open(microfunctionsListPickleFile, 'rb')
        l = pickle.load(f)
        f.close()
        return l
    except:
        return ["this-will-never-work", "notify", "hello-world", "asp-infrastructure"]


def getRunningJobsFromPyjobs():
    try:
        url = 'http://kong:8000/jobs/api/v1/search/?days=90&status=started&server=' + apigHost
        retries = urllib3.Retry(
            total=101, backoff_factor=0.5, status_forcelist=frozenset([500, 501, 502, 503]))
        http = urllib3.PoolManager(retries=retries, cert_reqs='CERT_NONE')
        r = http.request('GET', url)
        runningJobsData = json.loads(r.data)  # a list of dicts (job objects)

        """Store instance of jobQueue as a system file."""
        f = open(runningJobsPickleFile, 'wb')
        pickle.dump(runningJobsData, f)
        f.close()
    except:
        pass

def getMicrofunctionListFromPyjobs():
    try:
        url = 'http://kong:8000/jobs/api/v1/microfunction/'
        retries = urllib3.Retry(
            total=101, backoff_factor=0.5, status_forcelist=frozenset([500, 501, 502, 503]))
        http = urllib3.PoolManager(retries=retries, cert_reqs='CERT_NONE')
        r = http.request('GET', url)
        microfunctionListData = json.loads(r.data)  # a list of strings (job objects)
        for m in list(microfunctionListData):
            if "/" in m:
                microfunctionListData.remove(m)
        """Store instance of jobQueue as a system file."""
        f = open(microfunctionsListPickleFile, 'wb')
        pickle.dump(microfunctionsListPickleFile, f)
        f.close()
    except:
        pass

def getJobsFromASE():
    try:
        url = 'http://kong:8000/jobs?action=pendingjobs&server=' + apigHost
        retries = urllib3.Retry(total=101, backoff_factor=0.5, status_forcelist=frozenset([500, 501, 502, 503]))
        http = urllib3.PoolManager(retries=retries, cert_reqs='CERT_NONE')
        r = http.request('GET', url)
        pendingjobsData = json.loads(r.data)
        queue = {}
        if r.status == 200:
            for each in pendingjobsData:
                for jid in each:
                    jobData = each[jid]
                    constraints = {}
                    if jobData.get('constraints'):
                        for constraint in jobData.get('constraints'):
                            constraints[constraint['type']] = constraint['attributes']
                        inputs =  {}
                        if jobData.get('apig-payload'):
                            if jobData.get('apig-payload').get('inputs'):
                                inputs["inputs"] = jobData.get('apig-payload').get('inputs')
                        else:
                            inputs["inputs"] = {}

                        queue[jid] = {
                            "method": "POST", 
                            "constraints": constraints, 
                            "body": inputs, 
                            "microfunction": jobData.get('microfunction'),
                            "owners": jobData.get('owners'),
                            "type": jobData.get('type'),
                            "path": jobData.get('orig-req-path')
                        }

        """Store instance of jobQueue as a system file."""
        f = open(jobQueuePickleFile, 'wb')
        pickle.dump(queue, f)
        f.close()
    except:
        pass


def restartFetcher():
    # Find existing thread and ask it to stop
    for thread in threading.enumerate():
        if thread.name == fetchingThreadName:
            thread.stop()
            thread.join()
            while thread.is_alive():
                time.sleep(1)
    
    # Start a new thread
    fetcherThread = FetchTask()
    fetcherThread.start()
