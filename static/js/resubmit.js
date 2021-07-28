/* -----SETUP ANGULAR MODULE----- */
var app = angular.module('apig-resubmit-app', []);

/* -----SETUP ANGULAR CONTROLLER----- */
app.controller('apig-resubmit-controller', ['$scope', 'dataFactory', function($scope, dataFactory) {
  $scope.jidData = dataFactory.getJidData();

  $scope.setResubAuthHeader = function (headerMap) {
    dataFactory.setResubAuthHeader(headerMap);
  }

  $scope.setResubPayload = function (payload) {
    dataFactory.setResubPayload(payload);
  }

  $scope.resubPayload = dataFactory.getResubPayload();

  $scope.confirmResubmitJob = function () {
    $("#resub-page-card").hide();
    dataFactory.resubmitToAPIG();
  }

  $scope.resubmitJob = function () {
    var allInputElems = $(".resub-input-val");
    inputMap = {}
    constraintMap = []

    // Gather the existing inputs
    for (i = 0; i < allInputElems.length; i++) {
      var key = allInputElems[i].id;
      var val = allInputElems[i].value;
      inputMap[key] = val;
    }
    inputMap['apig_jid'] = $scope.jidData.jid;

    // Gather the new inputs
    var newInputElems = $(".resub-input-new");
    for (i = 0; i < newInputElems.length; i++) {
      var nKey = $(newInputElems[i]).find(".input-new-key")[0].value;
      var nVal = $(newInputElems[i]).find(".input-new-val")[0].value;
      if (nKey != "" && nVal != "") {
        inputMap[nKey] = nVal;
      }
    }

    if ($("#resub-pause").prop("checked")) {
      constraintMap.push({
        type: "pause",
        attributes: {}
      });
    }

    // OMITTED UNTIL WE HAVE THE APPROVAL CONSTRAINT BUILT
    // if ($("#resub-approval").prop("checked")) {
    //   constraintMap.push({type: "approval"});
    // }

    p = {}
    p['inputs'] = inputMap;

    p['constraints'] = constraintMap;
    console.log(p);
    $scope.setResubPayload(p);

    var encodedCreds = btoa($("#resub-username").val() + ':' + $("#resub-password").val());

    $scope.setResubAuthHeader({
      Authorization: encodedCreds
    });

    // // Show confirmation form
    $("#resubmit-job-form").hide();
    $("#resubmit-confirm").show();
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
    var resubHeaderMap = {};
    var resubPayload = {};

    var information = {jid: 'foobar-123', data: {}, active: false};

    var jid = $("#mJid").text();

    var url = '/api/v1/jobs/jids/' + jid;
    $http.get(url).then(function (r) {
      if (r.status == 200) {
        information.data = r.data;
        information.jid = jid;
        information.active = true;
        getOwners();
      } else {
        information.active = false;
      }
    });

    var getOwners = function() {
      if ("owners" in information.data) {
        if ($.isArray(information.data.owners)) {
          information.owners = information.data.owners;
        }
      }
    }



    // DATA FACTORY to SCOPE FUNCTIONS
    dataFactory.getJidData = function() {
      return information;
    }

    dataFactory.setResubAuthHeader = function (headerMap) {
      resubHeaderMap['headers'] = headerMap;
    }

    dataFactory.setResubPayload = function (payload) {
      resubPayload['payload'] = payload;
      resubPayload['orig-req-path'] = information.data['orig-req-path'];
    }

    dataFactory.getResubPayload = function() {
      return resubPayload;
    }

    dataFactory.resetResubPayload = function () {
      resubPayload = {};
    }

    dataFactory.resetResubHeaders = function () {
      resubHeaderMap = {};
    }

    dataFactory.resubmitToAPIG = function () {
      console.log('going to kong baby!');
      var url = "/api/v1/resubmit-job";
      $http({
        url: url,
        method: "POST",
        data: resubPayload,
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': resubHeaderMap.headers['Authorization']
        }
      }).then(function (r) {
        information.data.status = r.data.status;
      });
      dataFactory.resetResubPayload();
      dataFactory.resetResubHeaders();
    }

    // Finally, return the factory object
    return dataFactory;
  }
]);


