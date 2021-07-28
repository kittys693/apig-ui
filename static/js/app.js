/* -----SETUP ANGULAR MODULE----- */
var app = angular.module('apig-app', []);

/* -----SETUP ANGULAR CONTROLLER----- */
app.controller('apig-controller', ['$scope', 'dataFactory', function($scope, dataFactory) {

  /* ----- DOM OBJECTS ----- */

  $scope.selectedJob = dataFactory.getSelectedJob();

  $scope.updateActive = function(j) {
    dataFactory.updateActive(j);
  }

  $scope.title = dataFactory.getTitle();

  $scope.jobSearchResults = dataFactory.getJobSearchResults();
  $scope.runningJobSearchResults = dataFactory.getRunningJobSearchResults();

  $scope.queue = dataFactory.getQueue();

  $scope.procLockState = dataFactory.getProcessLockState();
  
  /* ----- SETTINGS ----- */

  $scope.lockProcessing = function() {
    dataFactory.lockProcessing();
  }

  $scope.unlockProcessing = function() {
    dataFactory.unlockProcessing();
  }

  $scope.reviewModeList = dataFactory.getReviewModeList();

  $scope.removeFromReviewModeList = function(mf) {
    dataFactory.removeFromReviewModeList(mf);
  }

  $scope.addToReviewModeList = function(mf) {
    $("#mfReviewModeAddition").val("");
    dataFactory.addToReviewModeList(mf);
  }

  /* ----- RESUBMITTING JOBS ----- */

  $scope.allkeys = dataFactory.getAllKeys();

  $scope.selectedResubJid = dataFactory.getSelectedResubJid();

  $scope.resubPayload = dataFactory.getResubPayload();
  $scope.editPayload = dataFactory.getEditPayload();

  $scope.updateActiveResubJid = function (obj) {
    dataFactory.updateActiveResubJid(obj.resubjid);
  }

  $scope.confirmResubmitJob = function() {
    $("#resubBtn").hide();
    dataFactory.resubmitToAPIG();
  }

  $scope.setResubAuthHeader = function(headerMap) {
    dataFactory.setResubAuthHeader(headerMap);
  }

  $scope.setResubPayload = function(payload) {
    dataFactory.setResubPayload(payload);
  }

  $scope.setEditPayload = function(payload) {
    dataFactory.setEditPayload(payload);
  }

  $scope.resubmitJob = function() {
    var allInputElems = $(".resub-input-val");
    inputMap = {}
    constraintMap = []

    // Gather the existing inputs
    for (i=0; i < allInputElems.length; i++) {
      var key = allInputElems[i].id;
      var val = allInputElems[i].value;
      inputMap[key] = val;
    }
    inputMap['apig_jid'] = $scope.selectedResubJid.jid;

    // Gather the new inputs
    var newInputElems = $(".resub-input-new");
    for (i=0; i < newInputElems.length; i++) {
      var nKey = $(newInputElems[i]).find(".input-new-key")[0].value;
      var nVal = $(newInputElems[i]).find(".input-new-val")[0].value;
      if (nKey != "" && nVal != "") {
        inputMap[nKey] = nVal;
      }
    }

    if ($("#resub-pause").prop("checked")) {
      constraintMap.push({type: "pause", attributes: {}});
    }

    // OMITTED UNTIL WE HAVE THE APPROVAL CONSTRAINT BUILT
    // if ($("#resub-approval").prop("checked")) {
    //   constraintMap.push({type: "approval"});
    // }

    p = {}
    p['inputs'] = inputMap;

    p['constraints'] = constraintMap;
    $scope.setResubPayload(p);

    var encodedCreds = btoa($("#resub-username").val() + ':' + $("#resub-password").val());

    $scope.setResubAuthHeader({ Authorization: encodedCreds});

    // Show confirmation form
    $("#resubmit-job-form").hide();
    $("#resubmit-confirm").show();
  }

  /* ----- JOB ----- */

  $scope.pauseJid = function(j) {
    dataFactory.pauseJid(j);
  }

  $scope.fetchJobInfo = function() {
    console.log('Fetching');
  }

  $scope.removeJid = function(j) {
    dataFactory.removeJid(j);
  }

  $scope.resumeJid = function(j) {
    dataFactory.resumeJid(j);
  }

  $scope.approveJob = function(j) {
    dataFactory.approveJob(j);
  }

  $scope.editJobSbmt = function(j) {
  //  var uriargsEditBody = $("#uriargsEditBody").val();
    constraintMap = []
    inputMap = {}
    parameterMap = {}
    var methodEditBody = $("#methodEditBody").val();
    var allInputElems = $(".edit-input-val");
        // Gather the existing inputs
        for (i=0; i < allInputElems.length; i++) {
          var key = allInputElems[i].id;
          var val = allInputElems[i].value;
          inputMap[key] = val;
        }
            
        // Gather the new inputs
        var newInputElems = $(".edit-input-new");
        for (i=0; i < newInputElems.length; i++) {
          var nKey = $(newInputElems[i]).find(".edit-input-new-key")[0].value;
          var nVal = $(newInputElems[i]).find(".edit-input-new-val")[0].value;
          if (nKey != "" && nVal != "") {
            inputMap[nKey] = nVal;
          }
        }

        var allParameterElems = $(".edit-uriargs-val");
        // Gather the existing inputs
        for (i=0; i < allParameterElems.length; i++) {
          var key = allParameterElems[i].id;
          var val = allParameterElems[i].value;
          parameterMap[key] = val;
        }
            
        // Gather the new inputs
        var newParameterElems = $(".edit-uriargs-new");
        for (i=0; i < newParameterElems.length; i++) {
          var nKey = $(newParameterElems[i]).find(".edit-uriargs-new-key")[0].value;
          var nVal = $(newParameterElems[i]).find(".edit-uriargs-new-val")[0].value;
          if (nKey != "" && nVal != "") {
            parameterMap[nKey] = nVal;
          }
        }
    
    if ($("#edit-pause").prop("checked")) {
      constraintMap.push({type: "pause", attributes: {}});
    }

    p = {}
    p['inputs'] = inputMap;
    p['constraints'] = constraintMap;
    p['uriargs'] = parameterMap;
    p['method'] = methodEditBody;
    $scope.setEditPayload(p);
    dataFactory.editJobSbmt(j);

  }

  /* ----- ALL JOBS ----- */

  $scope.pauseAll = function() {
    dataFactory.pauseAll();
  }

  $scope.removeAll = function() {
    dataFactory.removeAll();
  }

  $scope.resumeAll = function() {
    dataFactory.resumeAll();
  }

  $scope.initJob = function (jobId) {
    $scope.updateActive(jobId);
  }

  /* ----- JOB SEARCH PANEL ----- */
  $scope.searchForJobs = function() {
    dataFactory.toggleShowJobSearchButton();
    dataFactory.updateJobSearch();
  }

  $scope.canShowJobSearchButton = dataFactory.getCanShowJobSearchButton();

  }]);

app.config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
    });;

app.run(function(dataFactory) {});

/*  -----SETUP ANGULAR FACTORY dataFactory----- */
app.factory('dataFactory', ['$http', '$timeout',
  function($http, $timeout) {

    var dummyData = '{"foobar-123": {"body": {"inputs": {"foo": "bar"}}, "constraints": { "pause": {"attributes": {} }, "approval": {"attributes": {}} },"method": "POST", "path": "https://kong-sandbox.healthpartners.com/hello-fraunchless/", "submitTime": "11/15/2019,18:35:00", "uriArgs": {}}, "hello-fraunchless-20191115-183637-8039": {"body": {"inputs": {"baz": "zap", "c": 23,"d": {"e": "f"}, "seven": [{"1": "2"}, {"a": "b"}]}}, "constraints": {}, "method": "POST", "path": "https://kong-sandbox.healthpartners.com/hello-fraunchless/", "submitTime": "11/15/2019, 18:36:37", "uriArgs": {}}}';
    var q = JSON.parse(dummyData);
    var mflist = ['minuet', 'hello-fraunchless'];

    // This object is the current output of the job search
    var jobSearchResults = { information: { number: 0, jobs: {'example-jid-1': {'data': 'information'} } } };
    var showSearchButton = {active: true };
    var runningJobSearchResults = { information: { number: 0, jobs: {'example-jid-1': {'data': 'information'} } } };

    // init the factory object to be returned
    var dataFactory = {};

    /* ----- FACTORY FUNCTIONS ----- */

    var title = { value: 'APIG Admin' }

    var selectedJob = { active: false, jid: 'foobar-123' };

    var queue = { response: {}, calls: 0, length: 0 };

    var processLock = { response: { unlocked: true }, authorized: false };

    var reviewModeList = { response: { mf: [] }, length: 0, authorized: false };

    var updateSelectedJob = function() {
      if (queue.response.hasOwnProperty(selectedJob.jid)) {
        // Job exists in queue
        selectedJob.active = true;
      } else {
        // Job does not exist in queue anymore
        selectedJob.active = false;
      }
    }

    var updateTitle = function () {
      if (queue.length < 1) {
        title['value'] = 'APIG Admin'
      } else {
        title['value'] = '(' + queue.length.toString() + ') APIG Admin';
      }
    }

    var fetchJids = function() {
      var url = '/api/v1/jobs/jids';
      $http.get(url).then(function (r) {
        if (r.status == 200) {
          allkeys.keys = r.data.keys
          allkeys.length = Object.keys(r.data.keys).length;
        }
      });
    }

    var fetchQueue = function() {
      var url = '/api/v1/queue';
      $http.get(url).then(function(r) {
        if (r.status == 200) {
          queue.response = r.data.result.jobs;
          queue.calls++;
          queue.length = Object.keys(r.data.result.jobs).length;
        } else {
          queue.length = -1;
        }
      }, function(data) {
        // TODO: RESTORE BEFORE MERGING MTK-339
        // queue.length = -1;
        // queue.response = {};
        // queue.calls++;
        // console.log('error fetching queue');
        queue.length = (Object.keys(q).length);
        queue.response = q;
        queue.calls++;
      });
      updateTitle();
      updateSelectedJob();
    }

    var fetchProcLockState = function() {
      var url = '/api/v1/getprocesslockstate'
      $http.get(url).then(function(r) {
        if (r.status == 200) {
          processLock.response = r.data.result.unlocked;
        }
      },
      function(data) {
        console.log('error fetching process lock');
      });
    }

    var fetchReviewModeList = function() {
      var url = '/api/v1/getreviewmodelist'
      $http.get(url).then(function(r) {
        if (r.status == 200) {
          reviewModeList.response = r.data.result;
          if (r.data.result) {
            reviewModeList.length = r.data.result.length;
          }
        } else {
          reviewModeList.length = -1;
        }
      },
      function(data) {
        console.log('error fetching review list');
      });
    }

    var queuePoller = function() {
      fetchQueue();
      fetchProcLockState();
      fetchReviewModeList();
      $timeout(queuePoller, 5000);
    }

    queuePoller();



    var jidKeysPoller = function () {
      fetchJids();
      $timeout(jidKeysPoller, 60000);
    }

    jidKeysPoller();

    var jidPoller = function(j) {
      var d = new Date();
      var currentTime = d.getTime();
      var waitTime = 1000;
      // If it has been less than half a second since the last update
      // AND the process is not waiting,
      // wait for waitTime and try again
      if (selectedResubJid.waiting) {

        if (currentTime - selectedResubJid.waitStart > waitTime) {
          console.log('Waiting is over');
          selectedResubJid.waiting = false;

          if (allkeys.keys.includes(selectedResubJid.jid)) {
            console.log('valid jid');
            selectedResubJid.valid = true;
            var url = '/api/v1/jobs/jids/' + selectedResubJid.jid;
            $http.get(url).then(function (r) {
              if (r.status == 200) {
                selectedResubJid.data = r.data;
                console.log(r.data);

              }
            });
          } else {
            selectedResubJid.data = false;
            selectedResubJid.valid = false;
          }
        }

      } else {

        if (d.getTime() - selectedResubJid.time < 500) {
          console.log('Waiting for a hot sec');
          selectedResubJid.waiting = true;
          selectedResubJid.waitStart = currentTime;
          $timeout(jidPoller, waitTime);
        }
      }
    }

    /* ----- DOM OBJECTS ----- */

    dataFactory.updateActiveResubJid = function(resubjid) {
      // Puts a function into a watch mode to wait until the user is done checking
      // Every time this function runs it updates the "time" param of the var selectedResubJid
      // and runs the helper function that checks again after half a second passes to see if
      // user is done entering information
      var d = new Date();
      selectedResubJid.time = d.getTime();
      selectedResubJid.jid = resubjid;
      jidPoller();
    }

    dataFactory.getQueue = function() {
      return queue;
    }

    dataFactory.getSelectedResubJid = function() {
      return selectedResubJid;
    }

    dataFactory.updateActive = function(selJob) {
      selectedJob.jid = selJob;
      updateSelectedJob();
    }

    dataFactory.getSelectedJob = function() {
      return selectedJob;
    }

    dataFactory.getTitle = function() {
      return title;
    }

    dataFactory.getProcessLockState = function() {
      return processLock;
    }

    /* ----- RESUBMIT JOB ------ */

    var resubPayload = {};
    var editPayload = {};
    var resubHeaderMap = {};

    var allkeys = { keys: [], length: 0 };

    var selectedResubJid = { jid: 'foobar-123', valid: false, waiting: false };

    dataFactory.setResubPayload = function(payload) {
      resubPayload['payload'] = payload;
      resubPayload['orig-req-path'] = selectedResubJid.data['orig-req-path'];
    }

    dataFactory.setEditPayload = function(payload) {
      editPayload['payload'] = payload;
    }

    dataFactory.resetResubPayload = function() {
      resubPayload = {};
    }


    dataFactory.resetEditpayload = function() {
      editPayload = {};
    }
    dataFactory.resetResubHeaders = function () {
      resubHeaderMap = {};
    }

    dataFactory.getResubPayload = function() {
      return resubPayload;
    }
    dataFactory.getEditPayload = function() {
      return editPayload;
    }

    dataFactory.setResubAuthHeader = function(headerMap) {
      resubHeaderMap['headers'] = headerMap;
    }

    dataFactory.resubmitToAPIG = function() {
      console.log('going to kong baby!');
      var url = "/api/v1/resubmit-job";
      $http({
        url: url,
        method: "POST",
        data: resubPayload,
        headers: {'Content-Type': 'application/json', 'X-Authorization': resubHeaderMap.headers['Authorization']}
      }).then(function(r) {
        console.log(r.status);
      });
      dataFactory.resetResubPayload();
      dataFactory.resetResubHeaders();

    }

    /* ----- SETTINGS ----- */

    dataFactory.lockProcessing = function () {
      var url = '/api/v1/jobs/lockprocessing';
      $http.get(url).then(function (r) {
      });
      fetchProcLockState();
    }

    dataFactory.unlockProcessing = function () {
      var url = '/api/v1/jobs/unlockprocessing';
      $http.get(url).then(function (r) {
      });
      fetchProcLockState();
    }

    dataFactory.addToReviewModeList = function (mf) {
      var url = '/api/v1/jobs/addtoreviewmodelist/' + mf;
      $http.get(url).then(function (r) {
      });
      fetchReviewModeList();
    }

    dataFactory.removeFromReviewModeList = function (mf) {
      var url = '/api/v1/jobs/removefromreviewmodelist/' + mf;
      $http.get(url).then(function (r) {
      });
      fetchReviewModeList();
    }

    dataFactory.getAllKeys = function() {
      return allkeys;
    }

    dataFactory.getReviewModeList = function () {
      return reviewModeList;
    }

    /* ----- JOB ----- */

    dataFactory.removeJid = function(j) {
      var remUrl = '/api/v1/job/remove/' + j;
      $http.get(remUrl).then(function(r) {
      });
      fetchQueue();
    }

    dataFactory.resumeJid = function(j) {
      var resumeUrl = '/api/v1/job/resume/' + j;
      $http.get(resumeUrl).then(function(r) {
      });
      fetchQueue();
      updateSelectedJob();
    }

    dataFactory.pauseJid = function(j) {
      var pauseUrl = '/api/v1/job/pause/' + j;
      $http.get(pauseUrl).then(function(r) {
      });
      fetchQueue();
    }

    dataFactory.approveJob = function(j) {
      var approveUrl = '/api/v1/job/approve/' + j;
      $http.get(approveUrl).then(function (r) {});
      fetchQueue();
    }

    dataFactory.editJobSbmt = function(j) {
      var url = '/api/v1/job/edit/' + j;
      console.log(editPayload);
      $http({
        url: url,
        method: "POST",
        data: editPayload,
        headers: {'Content-Type': 'application/json'}
      }).then(function(r) {
        console.log(r.status);
      });
      dataFactory.resetEditPayload();
//      dataFactory.resetResubHeaders();
    }

    /* ----- ALL JOBS ----- */

    dataFactory.pauseAll = function() {
      var pauseAllUrl = '/api/v1/jobs/pause';
      $http.get(pauseAllUrl).then(function(r) {
      });
      fetchQueue();
    }

    dataFactory.resumeAll = function() {
      var resumeAllUrl = '/api/v1/jobs/unpause';
      $http.get(resumeAllUrl).then(function(r) {
      });
      fetchQueue();
    }

    dataFactory.removeAll = function() {
      var removeAllUrl = '/api/v1/jobs/remove';
      $http.get(removeAllUrl).then(function(r) {
      });
      fetchQueue();
    }

    /* ----- JOB SEARCH ----- */
    dataFactory.getJobSearchResults = function() {
      return jobSearchResults;
    }

    dataFactory.getCanShowJobSearchButton = function() {
      return showSearchButton;
    }

    dataFactory.toggleShowJobSearchButton = function() {
      console.log('TOGGLE SHOW JOB SEARCH START VALUE');
      console.log(showSearchButton);
      if (showSearchButton.active) {
        showSearchButton.active = false;
      } else {
        showSearchButton.active = true;
      }
      console.log('TOGGLE SHOW JOB SEARCH END VALUE');
      console.log(showSearchButton);
    }

    dataFactory.updateJobSearch = function() {
      jobSearchResults.information.number = 0;
      // Obtain the current filter values
      var daysParam = $("#filter-time")[0].value; // returns a string representing the 'days' uri arg
      var statusParam = $("#filter-status")[0].value; // returns a string representing the 'status' uri arg
      var nameParam = $("#filter-name")[0].value;

      // Make a call to the backend
      var filterUrl = "/api/v1/search/?days=" + daysParam + "&status=" + statusParam;
      $http.get(filterUrl).then(function(r) {
        var jobSearchResultsList = r.data;
        var matchingJobs = []

        // See if request includes text to filter by
        if (nameParam != "") {
          var matchText = new RegExp(nameParam);
          // Loop over return results and push any matching results into the final array
          for (i = 0; i < jobSearchResultsList.length; i++) {
            if (matchText.test(jobSearchResultsList[i]['apig_jid'])) {
              matchingJobs.push(jobSearchResultsList[i]);
            }
          }
        } else {
          matchingJobs = jobSearchResultsList;
        }
        jobSearchResults.information.number = matchingJobs.length;
        jobSearchResults.information.jobs = matchingJobs;
        showSearchButton.active = true;
      });
    }

    /* ----- RUNNING JOB FETCH ----- */
    dataFactory.getRunningJobSearchResults = function() {
      return runningJobSearchResults;
    }

    var fetchRunningJobs = function() {
      var url = "/api/v1/search/running/"
      $http.get(url).then(function(r) {
        var jobSearchResultsList = r.data.result.jobs;
        runningJobSearchResults.information.number = jobSearchResultsList.length;
        runningJobSearchResults.information.jobs = jobSearchResultsList;
      },
      function(data) {
        console.log('error fetching running jobs list');
      });
    }

    var runningJobsPoller = function() {
      fetchRunningJobs();
      $timeout(runningJobsPoller, 5000);
    }

    runningJobsPoller();

    // Finally, return the factory object
    return dataFactory;
  }
]);


