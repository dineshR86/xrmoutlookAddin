/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */
// import 'jquery';
//  import 'bootstrap';
//import 'bootstrap-select';



var queryobj = {
    sitecollection: "",
    list: "",
    statusfilter: "",
    clientfilter: "",
    clientfield: "",
    stakeholderfilter: "",
    stakeholderfield: "",
    filterfield: ""
}

var mailitem = {
    Subject: "",
    To: "",
    From: "",
    ConversationId: "",
    Received: "",
    Message: "",
    ConversationTopic:"",
    itemid:"",
    listid:"",
    sitecollectionUrl:"",
    listname:""
}

var hosturl="https://xrmaddin.azurewebsites.net/api/";
var securecode="yXSBa1SLBbAvC7p7HIsLZ/R5PwZNwEOapWimJHma8eui5jBtHyL26w==";


// $(document).ready(function () {
//     fetchConfigData();
//    loadData();
//     //getMailData(Office.context.mailbox.item);
// });

//The initialize function must be run each time a new page is loaded
Office.initialize = (reason) => {
    //when you browse the page outside outlook load the document.ready outside the this method.
    $(document).ready(function () {
       fetchConfigData();
       loadData();
    });
};


function getListItems(querydata) {

    var querystring = {
        domain:$("#domain").val()
    };

    if (querydata.clientfield.length > 0 && querydata.stakeholderfield.length > 0 && querydata.clientfilter.length >0 && querydata.stakeholderfilter.length >0) {
        //querystring = "sc=" + querydata.sitecollection + "&list=" + querydata.list + "&ff=" + querydata.clientfield + "&val=" + querydata.clientfilter + "&ff1=" + querydata.stakeholderfield + "&val1=" + querydata.stakeholderfilter;
        querystring.sc=querydata.sitecollection;
        querystring.list=querydata.list;
        querystring.ff=querydata.clientfield;
        querystring.val=querydata.clientfilter;
        querystring.ff1=querydata.stakeholderfield;
        querystring.val1=querydata.stakeholderfilter;
    } else if (querydata.clientfield.length > 0 && querydata.clientfilter.length >0) {
        //querystring = "sc=" + querydata.sitecollection + "&list=" + querydata.list + "&ff=" + querydata.clientfield + "&val=" + querydata.clientfilter;
        querystring.sc=querydata.sitecollection;
        querystring.list=querydata.list;
        querystring.ff=querydata.clientfield;
        querystring.val=querydata.clientfilter;
        querystring.ff1="";
        querystring.val1="";
    } else if (querydata.stakeholderfield.length > 0 && querydata.stakeholderfilter.length >0) {
        //querystring = "sc=" + querydata.sitecollection + "&list=" + querydata.list + "&ff=" + querydata.stakeholderfield + "&val=" + querydata.stakeholderfilter;
        querystring.sc=querydata.sitecollection;
        querystring.list=querydata.list;
        querystring.ff=querydata.stakeholderfield;
        querystring.val=querydata.stakeholderfilter;
        querystring.ff1="";
        querystring.val1="";
    }
    else {
        //querystring = "sc=" + querydata.sitecollection + "&list=" + querydata.list + "&ff=" + querydata.filterfield + "&val=" + querydata.statusfilter;
        querystring.sc=querydata.sitecollection;
        querystring.list=querydata.list;
        querystring.ff=querydata.filterfield;
        querystring.val=querydata.statusfilter;
        querystring.ff1="";
        querystring.val1="";
    }

    console.log(querystring);
    fetchListItems(querystring);

}


function loadData() {
    //$('#run').click(run);
    //$.fn.selectpicker.Constructor.BootstrapVersion = '4';
    //Event handler for site collection dropdown
    $("#sitecollections").on("change", function (event) {
        var optionselected = $(this).find("option:selected");
        if (optionselected.text() == "-select-") {
            $("#lists").css("display", "none");
        } else {
            $("#lists").css("display", "block");
            queryobj.sitecollection = optionselected.val();
            mailitem.sitecollectionUrl=optionselected.val();
            fetchContractFilterData();
        }
        $(this).attr("disabled", "disabled");
        //console.log(optionselected.text());
    });

    //Event handler for lists change event
    $("#listsdd").on("change", function (event) {
        var optionselected = $(this).find("option:selected");
        if (optionselected.text() == "-select-") {
            $("#casefilter").css("display", "none");
            $("#projectfilter").css("display", "none");
            $("#contractfilter").css("display", "none");
        } else if (optionselected.val().indexOf("Cases") > -1) {
            $("#casefilter").css("display", "block");
            $("#projectfilter").css("display", "none");
            $("#contractfilter").css("display", "none");
        } else if (optionselected.val().indexOf("Projects") > -1) {
            $("#casefilter").css("display", "none");
            $("#projectfilter").css("display", "block");
            $("#contractfilter").css("display", "none");
        } else if (optionselected.val().indexOf("Contracts") > -1) {
            $("#casefilter").css("display", "none");
            $("#projectfilter").css("display", "none");
            $("#contractfilter").css("display", "block");
        }
        queryobj.list = optionselected.text();
        mailitem.listname=optionselected.text();
        mailitem.listid="Lists/"+optionselected.val();
        $("#listsdd").attr("disabled", "disabled");
    });

    //event handler for filter change event
    $("#casestatus,#projectstatus,#relatedClient,#relatedStakeholder").on("change", function (event) {
        var optionselected = $(this).find("option:selected");
        var parentselect = optionselected.prevObject;
        if (parentselect[0].id == "casestatus") {
            queryobj.statusfilter = optionselected.val();
            queryobj.filterfield = "StatusLookupId";
        } else if (parentselect[0].id == "projectstatus") {
            queryobj.statusfilter = optionselected.val();
            queryobj.filterfield = "Status";
        } else if (parentselect[0].id == "relatedClient") {
            queryobj.clientfilter = optionselected.val();
            queryobj.clientfield = "ClientContractPartyLookupId";
        } else if (parentselect[0].id == "relatedStakeholder") {
            queryobj.stakeholderfilter = optionselected.val();
            queryobj.stakeholderfield = "StakeholderContractPartyLookupId";
        }

        $("#btnFetch").css("display", "block");
    });

    // event handler for fetch
    $("#btnFetch").click(function (event) {
        $("#xrmitems").css("display", "block");
        $("#xrmitemsDD").empty();
        $("#xrmitemsDD").append('<option value="">-selected-</option>');
        getListItems(queryobj);
    });

    $("#xrmitemsDD").on("change",function(event){
        if($(this).find("option:selected").text()=="-selected-"){
            $("#btnSave").css("display","none");    
        }else{
            $("#btnSave").css("display","block");
            mailitem.itemid=$(this).find("option:selected").val();
        }
    });

    $("#btnSave").click(function (event) {
        console.log("btn save");
        if($("#xrmitemsDD").find("option:selected").text()=="-selected-"){
            $("#afailure").text("No Item is selected").css("display","block");
            return false;
        }else{
            $("#afailure").css("display","None");
        }

        if($("#saveemail").is(":checked")||$("#saveattachments").is(":checked")){
            $("#afailure").css("display","None");

            if($("#saveemail").is(":checked")){
                getMailData(Office.context.mailbox.item);
            }

            if($("#saveattachments").is(":checked")){
                getMailAttachments();
            } 
        }else{
            console.log("Saveemail must be checked");
            $("#afailure").text("No data to save").css("display","block");
        }
    });
}

function fetchConfigData() {
    $(".loader").css("display", "block");
    var domain=$("#domain").val();
    //console.log("Fetching Config list data");
    $.ajax({
        url: hosturl+"GetXRMAddInConfiguration?domain="+domain+"&code="+securecode,
        method: "Get",
        headers: { "Accept": "application/json;odata=verbose" },
        success: function (data) {
            //var configdata=JSON.parse(data);
            $.each(data.SiteCollectionUrls.split(";"), (index, value) => {
                $("#sitecollections").append('<option value="' + value + '">' + value + '</option>')
            });

            $.each(data.Lists.split(";"), (index, value) => {
                
                $("#listsdd").append('<option value="' + value.split(":")[0] + '">' + value.split(":")[1] + '</option>')
            });

            $.each(data.ProjectStatusFilter.split(";"), (index, value) => {
                $("#projectstatus").append('<option value="' + value + '">' + value + '</option>')
            });
            $(".loader").css("display", "none");
            //$("#asuccess").text(data).css("display","block");
        },
        error: function (data) { 
            console.log(data);
            $("#afailure").text(data.statusText+":"+data.responseJSON).css("display","block");
            $(".loader").css("display", "none");
         }
    });
}

function fetchContractFilterData() {
    $(".loader").css("display", "block");
    //console.log("Fetching Config list data");
    var reqdata={
        sc:$("#sitecollections").find("option:selected").val(),
        domain:$("#domain").val()
    }

    $.ajax({
        url: hosturl+"GetContractFilters?code="+securecode,
        method: "POST",
        data:JSON.stringify(reqdata),
        headers: { "Accept": "application/json;odata=verbose", "content-type": "application/json;odata=verbose" },
        success: function (data) {
            $.each(data.Clients, (index, value) => {
                var clientoptions = value.split(",");
                $("#relatedClient").append('<option value="' + clientoptions[1] + '">' + clientoptions[0] + '</option>')
            });

            $.each(data.Stakeholders, (index, value) => {
                var stakeholderoptions = value.split(",");
                $("#relatedStakeholder").append('<option value="' + stakeholderoptions[1] + '">' + stakeholderoptions[0] + '</option>')
            });

            $.each(data.Status, (index, value) => {
                var statusOptions = value.split(",");
                $("#casestatus").append('<option value="' + statusOptions[1] + '">' + statusOptions[0] + '</option>')
            });
            $(".loader").css("display", "none");
        },
        error: function (data) { 
            console.log(data); 
            $("#afailure").text(data.statusText+":"+data.responseText).css("display","block");
            $(".loader").css("display", "none");
        }
    });
}

function fetchListItems(queryString) {
    $(".loader").css("display", "block");
    //console.log("Fetching list item data");
    $("#ddsaveemail").css("display", "block");
    $("#ddsaveattachments").css("display", "block");
    $.ajax({
        url: hosturl+"GetListItems?code="+securecode+"&" + queryString,
        method: "POST",
        data:JSON.stringify(queryString),
        headers: { "Accept": "application/json;odata=verbose", "content-type": "application/json;odata=verbose" },
        success: function (data) {
            console.log(data);
            $.each(data, (index, value) => {
                $("#xrmitemsDD").append('<option value="' + value.ID + '">' + value.Title + '</option>');
            });
            // $('#xrmitemsDD').selectpicker();
            // $('#xrmitemsDD').addClass("selectpicker");
            $("#btnFetch").css("display", "none");
            $(".loader").css("display", "none");
        },
        error: function (data) { 
            console.log(data); 
            $("#afailure").text(data.statusText+":"+data.responseText).css("display","block");
            $(".loader").css("display", "none");
        }
    });
}

function getMailData(item) {
    $(".loader").css("display", "block");
    // //Office.context.mailbox.item.to.getAsync(getToAddress);
    mailitem.domain=$("#domain").val();
    mailitem.Subject = item.subject;
    mailitem.ConversationTopic=item.subject;
    mailitem.From = buildEmailAddressString(item.from);
    mailitem.Received = new Date(item.dateTimeCreated).toISOString();
    mailitem.ConversationId = item.conversationId;
    mailitem.sitecollectionUrl= $("#sitecollections").find("option:selected").val();
    mailitem.listname="Outlook Emails";
    mailitem.To=buildToEmailAddressesString(item.to);
    item.body.getAsync('text', function (result) {
        if (result.status === 'succeeded') {
            mailitem.Message = result.value;
            saveMailData();
        }
    });
    //console.log(mailitem);
    
    $(".loader").css("display", "none");
}

function saveMailData(){
   console.log(JSON.stringify(mailitem));
    $.ajax({
        url:hosturl+"SaveItem?code="+securecode,
        method:"POST",
        data:JSON.stringify(mailitem),
        headers:{ "Accept": "application/json;odata=verbose", "content-type": "application/json;odata=verbose" },
        success:function(data){
            console.log(data);
            var msg= $("#asuccess").text();
            $("#asuccess").text(msg+"<br/>"+data.summary).css("display","block");
            //https://docs.microsoft.com/en-in/javascript/api/office/office.ui?product=outlook&view=office-js#closeContainer
            Office.context.ui.closeContainer();
            $("#savesection").css("display","none");
        },
        error:function(error){
            console.log(error);
            $("#afailure").text(error.statusText+":"+error.responseJSON.summary).css("display","block");
        }
    })
}

// Format an EmailAddressDetails object as
  // GivenName Surname <emailaddress>
  function buildEmailAddressString(address) {
    return address.displayName + ":" + address.emailAddress + ";";
  }
  
  // Take an array of EmailAddressDetails objects and
  // build a list of formatted strings, separated by a line-break
  function buildToEmailAddressesString(addresses) {
    if (addresses && addresses.length > 0) {
      var returnString = "";
      
      for (var i = 0; i < addresses.length; i++) {
        if (i > 0) {
          returnString = returnString + "<br/>";
        }
        returnString = returnString + buildEmailAddressString(addresses[i]);
      }
      
      return returnString;
    }
    
    return "None";
  }

  function getMailAttachments(){
      //form the mail attachment object
    var attachdata={
        UserId:Office.context.mailbox.userProfile.emailAddress,
        MessageId:Office.context.mailbox.convertToRestId(Office.context.mailbox.item.itemId,Office.MailboxEnums.RestVersion.v2_0),
        ItemTitle: $("#xrmitemsDD").find("option:selected").text(),
        ItemID:$("#xrmitemsDD").find("option:selected").val(),
        ListName:$("#listsdd").find("option:selected").val(),
        sitecollectionUrl:$("#sitecollections").find("option:selected").val(),
        domain:$("#domain").val()
    }

    saveMailAttachments(attachdata);
  }

  function saveMailAttachments(data){
    //console.log(JSON.stringify(data));
    $.ajax({
        url:hosturl+"SaveAttachments?code="+securecode,
        method:"POST",
        data:JSON.stringify(data),
        headers:{ "Accept": "application/json;odata=verbose", "content-type": "application/json;odata=verbose" },
        success:function(data){
            console.log(data);
            var msg= $("#asuccess").text();
            $("#asuccess").text(msg+"<br/>"+data.summary).css("display","block");
        },
        error:function(error){
            console.log(error);
            $("#afailure").text(error.statusText+":"+error.responseJSON.summary).css("display","block");
        }
    });
  }

