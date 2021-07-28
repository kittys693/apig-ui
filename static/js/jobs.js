/* -----SETUP ANGULAR MODULE----- */
var app = angular.module('apig-jobs-app', []);

/* -----SETUP ANGULAR CONTROLLER----- */
app.controller('apig-jobs-controller', ['$scope', 'dataFactory', function($scope, dataFactory) {
  $scope.jidData = dataFactory.getJidData();

  $scope.jobDuration = function() { 
      var duration_in_seconds = dataFactory.getJidData()['data']['job_duration_seconds'];
      return dataFactory.jobDuration(duration_in_seconds);
  }

  $scope.setResubAuthHeader = function (headerMap) {
    dataFactory.setResubAuthHeader(headerMap);
  }

  $scope.isCollapsed = true;

  $scope.childJobFailureStatusList = ["failed", "failure", "fail", "error", "unsuccessful", "orphan", "orphaned", "timeout", "terminated"];

  $scope.hasChildrenJobs = function () {
    var c = dataFactory.getJidData()['data']['children_jobs'];
    if (c) {
      return true;
    } else {
      return false;
    }
  }

  $scope.hasUpstreamJob = function () {
    var c = dataFactory.getJidData()['data']['apig-payload']['inputs']['upstream_jid'];;
    if (c) {
      return true;
    } else {
      return false;
    }
  }

  $scope.hasConstraints = function () {
    var c = dataFactory.getJidData().constraints;
    for(var prop in c) {
      if (c.hasOwnProperty(prop)) {
        return true;
      } else {
        return false;
      }
    }
  }

  $scope.markJobSuccessful = function () {
    dataFactory.markJobSuccessful();
  }


  $scope.hasApprovalConstraint = function () {
    var c = dataFactory.getJidData().constraints;
    for(var prop in c) {
      if (c.hasOwnProperty(prop)) {
        if (c.hasOwnProperty('approval')) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  $scope.isValidJob = function() {
    // Returns true if job can be accessed via ASE
    var j = dataFactory.getJidData().data;
    if (j.hasOwnProperty("apig_jid")) {
      return true;
    } else {
      return false;
    }
  }

  $scope.canEdit = function() {
    // Returns true if job can be edited - SHOULD BE MOVED TO SERVER SIDE LOGIC
    var NON_EDITABLE_STATUSES = ["started", "successful"];
    if (NON_EDITABLE_STATUSES.includes(dataFactory.getJidData().data.status)) {
      return false;
    } else {
      return true;
    }
  }

  $scope.canResubmit = function() {
    // Returns true if job status fits any of the resubmittable statuses
    var RESUBMITABLE_STATUSES = ["terminated", "orphaned", "failed"];
    if (RESUBMITABLE_STATUSES.includes(dataFactory.getJidData().data.status)) {
      return true;
    } else {
      return false;
    }
  }

  $scope.canTerminate = function() {
    // Returns true if job is terminate-able
    var TERMINATEABLE_STATUSES = ["pending", "started"];
    if (TERMINATEABLE_STATUSES.includes(dataFactory.getJidData().data.status)) {
      return true;
    } else {
      return false;
    }
  }

  $scope.isPending = function() {
    // Returns true if the job is in a pending state
    if (dataFactory.getJidData().data.status == 'pending') {
      return true;
    } else {
      return false;
    }
  }

  $scope.isRunning = function() {
    // Returns true if the job is in a pending state
    if (dataFactory.getJidData().data.status == 'started') {
      return true;
    } else {
      return false;
    }
  }

  $scope.isCurrentlyFailed = function() {
    // Returns true if the job is in a pending state
    var FAILURE_STATUSES = ["failed"];
    if (FAILURE_STATUSES.includes(dataFactory.getJidData().data.status)) {
      return true;
    } else {
      return false;
    }
  }

  $scope.resubmitJob = function () {
    var username = $("#resubmit-username-entry").val();
    var basicAuthHeaderValue = "Basic " + btoa(username + ":" + $("#resubmit-password-entry").val());
    dataFactory.resubmitJob(username, basicAuthHeaderValue);
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

  $scope.approveJob = function() {
    dataFactory.approveJob();
  }

  // Submit the edited payload to /jobs
  $scope.editJobSbmt = function() {

    var inputs = {};

    // Get all the divs containing key value pairs
    var allKeyValuePairElements = $('.edit-input-new');

    // loop over every div to build the payload
    for (var i = 0; i < allKeyValuePairElements.length; i++) {
      var pairs = $(allKeyValuePairElements[i])[0];

      // Get key - always assumed to be a string
      var key = $(pairs).children('.edit-input-new-key')[0].value;

      // Get the value - starts as a string
      var extractedValue = $(pairs).children('.edit-input-new-val')[0].value;

      // Transform the value into its proper type
      var value = extractedValue;

      // Integer (parseFloat handles both 3 and 3.5)
      if (parseFloat(extractedValue)) {
        value = parseFloat(extractedValue);
      } else if ((extractedValue.charAt(0) == "{" && extractedValue.charAt(extractedValue.length - 1) == "}")) { // Check if object
        value = JSON.parse(extractedValue);
      } else if ((extractedValue.charAt(0) == "[" && extractedValue.charAt(extractedValue.length - 1) == "]")) { // Check if array
        value = JSON.parse(extractedValue);
      } else { // Assume a string
        value = extractedValue.trim();
      }

      if (key != "" && value != "") {
        // Add to inputs object
        inputs[key] = value;
      }
    }

    // Nest key - definitely a better way to build this javascript object
    apigPayload = {}
    apigPayload['inputs'] = inputs;

    finalInputsPayload = {};
    finalInputsPayload['apig-payload'] = apigPayload;

    dataFactory.editJobSbmt(finalInputsPayload);
  }

  // Children jobs analytics
  $scope.childrenJobsStatusMap = dataFactory.getChildrenJobStatusMap();

  $scope.getChildrenJobTypeStyles = function(status) {
    return dataFactory.getChildrenJobTypeStyles(status);
  }

}]);

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});;

app.run(function(dataFactory) {});

/*  -----SETUP ANGULAR FACTORY dataFactory----- */
app.factory('dataFactory', ['$http', '$timeout',
  function($http, $timeout) {
    // init the factory object to be returned
    var dataFactory = {};

    var childrenJobsStatusMap = {};
    var childrenJobTypeStyles = {};

    var information = {jid: 'foobar-123', data: {'example': 'data'}, active: false};

    var jid = $("#mJid").text();

    var url = '/api/v1/jobs/jids/' + jid;

    var fetchJob = function() {
      $http.get(url).then(function (r) {
        if (r.status == 200) {
          information.data = r.data;

          // Specialty format the constraints data if it exists
          var constraints = {};
          if (r.data['constraints']) {
            var fetchedConstraintsList = r.data['constraints'];
            for(var i=0; i < fetchedConstraintsList.length; i++) {
              var type = fetchedConstraintsList[i]['type'];
              var val = fetchedConstraintsList[i]['attributes'];
              constraints[type] = val;
            }
          }
          information.constraints = constraints;
          information.jid = jid;
          information.active = true;
          getOwners();
          updateChildrenJobsStatusMap();
        } else {
          information.active = false;
        }
      });
    }

    var jobPoller = function() {
      fetchJob();
      $timeout(jobPoller, 1000);
    }

    jobPoller();

    var getOwners = function() {
      if ("owners" in information.data) {
        if ($.isArray(information.data.owners)) {
          information.owners = information.data.owners;
        }
      }
    }

    dataFactory.jobDuration = function(duration_in_seconds) {
      console.log(duration_in_seconds);
      dateObj = new Date(duration_in_seconds * 1000);
      hours = dateObj.getUTCHours();
      minutes = dateObj.getUTCMinutes();
      seconds = dateObj.getSeconds();

      timeString = hours.toString().padStart(2, '0')
        + ':' + minutes.toString().padStart(2, '0')
        + ':' + seconds.toString().padStart(2, '0');
      console.log(timeString);
      return timeString;
    }

    // DATA FACTORY to SCOPE FUNCTIONS
    dataFactory.getJidData = function() {
      return information;
    }

    /* ----- JOB ----- */

    dataFactory.removeJid = function(j) {
      var remUrl = '/api/v1/job/remove/' + j;
      $http.get(remUrl).then(function(r) {
      });
    }

    dataFactory.resumeJid = function(j) {
      var resumeUrl = '/api/v1/job/resume/' + j;
      $http.get(resumeUrl).then(function(r) {
      });
    }

    dataFactory.pauseJid = function(j) {
      var pauseUrl = '/api/v1/job/pause/' + j;
      $http.get(pauseUrl).then(function(r) {
      });
    }

    dataFactory.approveJob = function() {
      var j = information.jid;
      var approveUrl = '/api/v1/job/approve/' + j;
      console.log(j);
      // $http.get(approveUrl).then(function (r) {});
    }

    // Edit function
    dataFactory.editJobSbmt = function(payload) {
      var url = '/api/v1/job/edit/' + information.jid;

      $http({
        url: url,
        method: "POST",
        data: payload,
        headers: {'Content-Type': 'application/json'}
      }).then(function(r) {
        console.log(r.status);
      });
    }

    // Get completed percentage of children job status types
    dataFactory.getChildrenJobStatusMap = function() {
      return childrenJobsStatusMap;
    }

    var updateChildrenJobsStatusMap = function() {
      var totalJobs = 0;
      var readyJobs = 0;
      var completedJobs = 0;
      var runningJobs = 0;
      var waitingJobs = 0;
      var failedJobs = 0;
      var undefinedJobs = 0;

      // Establish the allowable values
      const STATUS_READY = ["ready"]
      const STATUS_WAITING = ["waiting"]
      const STATUS_FAILED = ["failed", "failure", "fail", "error", "unsuccessful", "orphan", "orphaned", "timeout", "terminated"]
      const STATUS_RUNNING = ["running"]
      const STATUS_COMPLETED = ["completed"]

      // Classify the different job states
      if (information['data']['children_jobs']) {

        // Read the total keys in the object
        totalJobs = Object.keys(information['data']['children_jobs']).length;

        // Check all the states in children jobs
        for (var childJob in information['data']['children_jobs']) {
          let childJobStatus = information['data']['children_jobs'][childJob]['status'];
          if (STATUS_READY.indexOf(childJobStatus) > -1) {
            readyJobs += 1;
          } else if (STATUS_WAITING.indexOf(childJobStatus) > -1) {
            waitingJobs += 1;
          } else if (STATUS_FAILED.indexOf(childJobStatus) > -1) {
            failedJobs += 1;
          } else if (STATUS_RUNNING.indexOf(childJobStatus) > -1) {
            runningJobs += 1;
          } else if (STATUS_COMPLETED.indexOf(childJobStatus) > -1) {
            completedJobs += 1;
          } else {
            undefinedJobs += 1;
          }
        }
      }
      childrenJobsStatusMap['total'] = totalJobs;
      childrenJobsStatusMap['ready'] = readyJobs;
      childrenJobsStatusMap['waiting'] = waitingJobs;
      childrenJobsStatusMap['failed'] = failedJobs;
      childrenJobsStatusMap['running'] = runningJobs;
      childrenJobsStatusMap['completed'] = completedJobs;
      childrenJobsStatusMap['undefined'] = undefinedJobs;

      // updateStyles childrenJobTypeStyles object here
      childrenJobTypeStyles = {
        'jobCompletion': Math.ceil(completedJobs/totalJobs*100).toString() + '%',
        'total': {
          'width': '100%'
        },
        'ready': {
          'width': (readyJobs/totalJobs*100).toString() + '%'
        },
        'waiting': {
          'width': (waitingJobs/totalJobs*100).toString() + '%'
        },
        'failed': {
          'width': (failedJobs/totalJobs*100).toString() + '%'
        },
        'running': {
          'width': (runningJobs/totalJobs*100).toString() + '%'
        },
        'completed': {
          'width': (completedJobs/totalJobs*100).toString() + '%'
        }
      }

    }

    dataFactory.getChildrenJobTypeStyles = function(status) {
      return childrenJobTypeStyles[status];
    }

    // Mark the job successful in database
    dataFactory.markJobSuccessful = function () {
      var url = '/api/v1/job/edit/' + information.jid;

      var payload = {
        'status': 'successful'
      }

      $http({
        url: url,
        method: "POST",
        data: payload,
        headers: {'Content-Type': 'application/json'}
      }).then(function(r) {
        console.log(r.status);
      });
    }

    // Resubmit the job
    dataFactory.resubmitJob = function (username, basicAuthHeaderValue) {
      var url = '/api/v1/job/resubmit/' + information.jid;

      headers = {
        'Content-Type': 'application/json',
        'X-RESUBMIT-AUTH': basicAuthHeaderValue
      }

      var payload = {
        'method': 'POST',
        'path': information.data['orig-req-path']
      }

      // Add entry to timeline indicating who resubmitted job
      dataFactory.editJobSbmt({'event': username + ' resubmitted job'});

      $http({
        url: url,
        method: "POST",
        data: payload,
        headers: headers
      }).then(function(r) {
        console.log(r.status);
      });
    }

    // Finally, return the factory object
    return dataFactory;
  }
]);


