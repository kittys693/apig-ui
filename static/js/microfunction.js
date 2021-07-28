/* -----SETUP ANGULAR MODULE----- */
var app = angular.module('apig-microfunction-app', []);

/* -----SETUP ANGULAR CONTROLLER----- */
app.controller('apig-microfunctions-controller', ['$scope', 'dataFactory', function($scope, dataFactory) {

  $scope.microfunctionData = dataFactory.getMicrofunctionData();

  $scope.activeJobs = dataFactory.getActiveJobs();

  $scope.analytics = dataFactory.getAnalytics();

  $scope.isValidMicrofunction = function() {
    // Returns true if micro function can be read  via jobs
    var j = dataFactory.getMicrofunctionData().data;
    if (j.hasOwnProperty("meta")) {
      if (j["meta"].hasOwnProperty("pretty_name")) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
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

    var information = {microfunction: 'foobar-123', data: {'example': 'data'}, active: false};
    var activeJobs = {count: 0, jobs: {}, fetched: false};
    var analytics = {ready: false, data: {}};

    var microfunction = $("#mMicrofunction").text();
    $("#mMicrofunction").remove(); // stop the hackers

    var email = $("#mEmail").text();
    $("#mEmail").remove(); // stop the hackers

    information.microfunction = microfunction;

    var url = '/api/v1/microfunctions/' + microfunction;

    var fetchMicrofunctionData = function() {
      $http({
        url: url,
        method: "GET",
        headers: {'X-EMAIL': email}
      }).then(function(r) {
        information.data = r.data.result.data;
        information.isOwner = r.data.result.isOwner;
      });
    }

    var fetchActiveJobs = function() {
      // Obtain the current filter values
      var daysParam = "90"; // returns a string representing the 'days' uri arg
      var statusParam = "started"; // returns a string representing the 'status' uri arg
      var nameParam = information.microfunction;

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
        activeJobs.count = matchingJobs.length;
        activeJobs.jobs = matchingJobs;
        activeJobs.fetched = true;
      });
    }

    fetchMicrofunctionData();

    var poller = function() {
      fetchMicrofunctionData();
      fetchActiveJobs();
      $timeout(poller, 15000);
    }

    poller();

    dataFactory.getMicrofunctionData = function() {
      return information;
    }

    dataFactory.getActiveJobs = function() {
      return activeJobs;
    }

    /* ---- ANALYTICS ---- */
    var format = function(time) {   
      // Hours, minutes and seconds
      var hrs = ~~(time / 3600);
      var mins = ~~((time % 3600) / 60);
      var secs = ~~time % 60;

      // Output like "1:01" or "4:03:59" or "123:03:59"
      var ret = "";
      if (hrs > 0) {
          ret += "" + hrs + "h:" + (mins < 10 ? "0" : "");
      }
      ret += "" + mins + "m:" + (secs < 10 ? "0" : "");
      ret += "" + secs + "s";
      return ret;
    }

    var fetchAnalytics = function() {
      var calculatedData = {};
      // Obtain the current filter values ASYNC
      var daysParam = "60"; // returns a string representing the 'days' uri arg
      var statusParam = "successful"; // returns a string representing the 'status' uri arg
      var nameParam = information.microfunction;

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

        // Monthly impressions
        var totalJobsRanLastSixty = matchingJobs.length;
        var totalJobsRanLastSixtyWithTimes = totalJobsRanLastSixty;
        var jobsWithTimeInformation = [];
        var averageJobsRanPerMonth = Math.ceil(totalJobsRanLastSixty/parseInt(daysParam)*365/12);
        calculatedData.monthlyImpressions = averageJobsRanPerMonth;

        // Loop over the object only once
        var totalRunTime = 0;
        var totalJobsThatFailedOneOrMoreTimes = 0;
        for (j = 0; j < totalJobsRanLastSixty; j++) {

          var jobInstance = matchingJobs[j];

          // get job durations
          if (jobInstance.hasOwnProperty("job_duration_seconds")) {
            var jobRuntime = jobInstance["job_duration_seconds"];
            totalRunTime += jobRuntime;

            // add to sub dictionary
            jobsWithTimeInformation.push(jobInstance);

          } else {
            totalJobsRanLastSixtyWithTimes -= 1;
          }

          // search for the string of failure in the timeline obj
          var timelineAsString = JSON.stringify(jobInstance["timeline"]);
          if (timelineAsString.includes('"status":"failed"')) {
            totalJobsThatFailedOneOrMoreTimes += 1;
          }
        }

        // Average runtime
        if (jobsWithTimeInformation.length > 0) {
          var averageJobRuntime = format(Math.ceil(totalRunTime/totalJobsRanLastSixtyWithTimes));
          calculatedData.averageRuntime = averageJobRuntime;
        } else {
          calculatedData.averageRuntime = 'unavailable';
        }


        // 60-day success rate
        var successRate = Math.ceil((totalJobsRanLastSixty - totalJobsThatFailedOneOrMoreTimes)/totalJobsRanLastSixty*100)
        calculatedData.latestSuccessRate = successRate;
        
        // Last 5 jobs
        var sortedJobsByTimestamp = jobsWithTimeInformation.sort((a, b) => {
          return b.job_finished_epoch - a.job_finished_epoch;
        });
        var lastFiveJobs = sortedJobsByTimestamp.slice(0,5);
        calculatedData.lastFive = lastFiveJobs;

        analytics.data = calculatedData;
        analytics.ready = true;
      });
    }

    fetchAnalytics();

    dataFactory.getAnalytics = function() {
      return analytics;
    }

    // Finally, return the factory object
    return dataFactory;
  }
]);


