var startDocs = {};
var pausetime = performance.now();
var startWebEnv;
var startCount;
//var goodWebEnv;
//var badWebEnv;
//var skipWebEnv;
var searches = {};
var searchcount;
var sieveDocs = [];
var skipDocs = [];
var goodDocs = [];
var badDocs = [];




$("#lists").hide();
$("#results").hide();

$(document).keydown(function(e) {
  if(e.keyCode == 13) {
    //Because both IE and FF now "helpfully" ignore the spec and treat 'button' the same as 'submit'
    e.preventDefault();
    if($('#mainsearch').is(':visible')){
      $( "#runsearch" ).trigger( "click" );
    }
    if($('#nextsearch').is(':visible')){
      $( "#testversion" ).trigger( "click" );
    }
  }
});

$("#judge-doc").keydown(function(e) {
  if(e.key == "ArrowLeft") {
    $( "#markbad" ).trigger( "click" );
  }
  if(e.key == "ArrowUp") {
    $( "#markmeh" ).trigger( "click" );
  }
  if(e.key == "ArrowRight") {
    $( "#markgood" ).trigger( "click" );
  }
});

$("#runsearch").click(function(){
   $("#mainsearch").hide();
   $("#lists").show();
   var searchstr = $("#search").val();
   startSearch(searchstr);
 });

 $("#fetchmore").click(function(){
   getDoc(20);
   fetchunsorted();
  });

 //$( "#lists" ).on( "click", "li", function() {
//   var selecteddoc = $(this).attr("data-pmid");
//   showDoc(selecteddoc);
 ///});

 $( "#lists" ).on( "click", ".card", function() {
   var selecteddoc = $(this).attr("id");
   showDoc(selecteddoc);
 });

 $( ".row" ).on( "click", "#reset", function() {
     location.replace(location.pathname);
  });

 $("#starttest").click(function(){
    /*
    epost(goodDocs)
    .done(function( xml ) {
      $(xml).find('ePostResult').each(function(){
        goodWebEnv = $(this).find("WebEnv").text();
        console.log(goodWebEnv);
      });
    });
    epost(badDocs)
    .done(function( xml ) {
      $(xml).find('ePostResult').each(function(){
        badWebEnv = $(this).find("WebEnv").text();
      });
    });
    if (skipDocs.length > 0) {
      epost(skipDocs)
      .done(function( xml ) {
        $(xml).find('ePostResult').each(function(){
          skipWebEnv = $(this).find("WebEnv").text();
        });
      });
    }
    */
    $("#lists").hide();
    $("#variantperformance").hide();
    $("#results").show();
    var searchstr = $("#search").val();
    var totalsorted = goodDocs.length + badDocs.length + skipDocs.length;
    searches["start"] = { "search": searchstr, "screened": totalsorted, "good": goodDocs.length, "bad": badDocs.length };
    writeResults(searchstr, startCount, totalsorted, goodDocs.length, badDocs.length);
    searchcount = 0;
  });

  $("#testversion").click(function(){
    if($('#variantperformance').is(':hidden')){
      $("#variantperformance").show();
    }
    var searchstr = $("#refinesearch").val();
    var rowcount = $('#variantperformance tr').length;
    var goodhits;
    var badhits;
    var skiphits;
    var goodstring = "(" + goodDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
    //console.log(goodDocs);
    //console.log(goodstring);
    esearch(searchstr)
    .then(function( data ) {
      totalsearch = Number(data.esearchresult.count);
      console.log(totalsearch);
    esearch(searchstr + " AND " + goodstring)
    .then(function( data ) {
      goodhits = Number(data.esearchresult.count);
      //console.log(goodhits);
      var badstring = "(" + badDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
      //console.log(badDocs);
      //console.log(badstring);
      esearch(searchstr + " AND " + badstring)
      .then(function( data ) {
        if (badDocs.length > 0) {
          badhits = Number(data.esearchresult.count);
        } else {
          badhits = 0;
        }
        var skipstring = "(" + skipDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
        //console.log(skipDocs);
        //console.log(skipstring);
        esearch(searchstr + " AND " + skipstring)
        .then(function( data ) {
          if (skipDocs.length > 0) {
            skiphits = Number(data.esearchresult.count);
          } else {
            skiphits = 0;
          }
          searchcount = searchcount + 1;
          var totalsorted = goodhits + badhits + skiphits;
          searches[searchcount] = { "search": searchstr, "screened": totalsorted, "good": goodhits, "bad": badhits };
          writeVarResults(searchstr, totalsearch, totalsorted, goodhits, badhits);
        });
      });
    });
   });
  });

 $("#judge-doc button").click(function(){
   var selecteddoc = $( "#judge-doc .doctitle" ).attr("data-pmid");
   if ($(this).attr("id") == "markgood") { startDocs[selecteddoc].sortstatus = "Good" }
   if ($(this).attr("id") == "markmeh") { startDocs[selecteddoc].sortstatus = "Skipped" }
   if ($(this).attr("id") == "markbad") { startDocs[selecteddoc].sortstatus = "Bad" }
   updateLists();
   var mingood = $( "#minimumgood option:selected" ).val();
   if (goodDocs.length >= mingood) {
     $("#judge-doc").modal('hide');
     alert("All sorted!");
   } else {
     if (sieveDocs.length < 3) {
       getDoc(10);
     }
     fetchunsorted();
   }
  });

 function startSearch(term) {
   esearch(term)
   .then(function( data ) {
     startWebEnv = data.esearchresult.webenv;
     startCount = data.esearchresult.count;
     getDoc(40);
     fetchunsorted();
   });
 }

 /*
 function epost(array) {
    ids = array.join(',');
    return $.ajax({
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/epost.fcgi',
      data: {
        db: 'pubmed',
        id: ids,
        email: 'ed_sperr@hotmail.com',
        tool: 'searchtest',
        api_key: 'f069cf776feaa627ab9b1e0fc2b090610708'
      }
      });
 }
 */
 function esearch(term) {
    pausetime = performance.now();
    return $.ajax({
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      data: {
        db: 'pubmed',
        usehistory: 'y',
        term: term,
        retmode: 'json',
        retmax: 0,
        email: 'ed_sperr@hotmail.com',
        tool: 'searchtest',
        api_key: 'f069cf776feaa627ab9b1e0fc2b090610708'
      }
      });
 }

 /*
 function testsearch(webenv, term) {
  console.log("fired!");
  return $.ajax({
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      data: {
        db: 'pubmed',
        usehistory: 'y',
        term: term,
        query_key: 1,
        WebEnv: webenv,
        rettype: 'uilist',
        retmode: 'json',
        email: 'ed_sperr@hotmail.com',
        tool: 'searchtest',
        api_key: 'f069cf776feaa627ab9b1e0fc2b090610708'
      }
    });
 }
 */

 function efetch(index) {
    pausetime = performance.now();
    return $.ajax({
      url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
      data: {
        db: 'pubmed',
        retstart: index,
        retmax: 1,
        query_key: 1,
        WebEnv: startWebEnv,
        retmode: 'xml',
        rettype: 'abstract',
        email: 'ed_sperr@hotmail.com',
        tool: 'searchtest',
        api_key: 'f069cf776feaa627ab9b1e0fc2b090610708'
      }
    });
 }

 function getDoc(numrequired) {
   var indexes = [];
   var currentmeh = Number($("#mehnumber").text());
   $("#mehnumber").text(currentmeh + numrequired);
   for (i = 0; i < numrequired; i++) {
     var index = getRandomIntInclusive(1, startCount);
     indexes.push(index);
   }
   var uniqueindexes = indexes.filter( onlyUnique );
   for (i = 0; i < numrequired; i++)  {
     checktime();
     function checktime() {
       var t1 = performance.now();
       var timediff = t1 - pausetime;
       if (timediff > 500) {
         callutils();
       } else {
         setTimeout(checktime, 50);
       }
     }
     function callutils() {
       var myDoc = {};
       var index = indexes.pop();
       efetch(index)
       .done(function( xml ) {
         var authors = [];
         $(xml).find('PubmedArticle').each(function(){
           myDoc.pmid = $(this).find("PMID:first").text();
           if (startDocs[myDoc.pmid]) {
             console.log("We already have this one...")
           } else {
             myDoc.title = $(this).find("ArticleTitle").text();
             myDoc.abstract = $(this).find("AbstractText").text();
             var journal = $(this).find("Journal");
             myDoc.journalTitle = journal.find("Title").text();
             myDoc.journalAbbreviation = journal.find("ISOAbbreviation").text();
             var journalIssue = journal.find("JournalIssue");
             myDoc.volume = journalIssue.find("Volume").text();
             myDoc.issue = journalIssue.find("Issue").text();
             var journalDate = journalIssue.find("PubDate");
             myDoc.year = journalDate.find("Year").text();
             myDoc.month = journalDate.find("Month").text();
             myDoc.day = journalDate.find("Day").text();
             myDoc.medlinedate = journalDate.find("MedlineDate").text();
             myDoc.pages = $(this).find("MedlinePgn").text();
             $(this).find('Author').each(function(){
               var lastname = $(this).find("LastName").text();
               var intials = $(this).find("Initials").text();
               authors.push(lastname + " " + intials)
             });
             myDoc.authors = authors;
             myDoc.sortstatus = "Unsorted";
             startDocs[myDoc.pmid] = myDoc;
             sieveDocs.push(myDoc.pmid);
         }
       });
      });
     }
   }
 }

 function showDoc(pmid) {
   $("#doc-display").empty();
   var myDoc = startDocs[pmid];
   $("#judge-doc").modal();
   $("#currentstatus").text(myDoc.sortstatus);
   if (myDoc.sortstatus == "Unsorted") { $("#currentstatus").attr("style", "color:gray;") }
   if (myDoc.sortstatus == "Bad") { $("#currentstatus").attr("style", "color:red;") }
   if (myDoc.sortstatus == "Good") { $("#currentstatus").attr("style", "color:green;") }
   $("#doc-display").append('<div class="sievedoc"></div>');
   $(".sievedoc").append('<h4 class="card-title doctitle" data-pmid=' + pmid + '>' + myDoc.title + '</h4>');
   var citestring = '<em>' + myDoc.journalTitle + '</em>. ' + formatIssuestring(startDocs[pmid]);
   var myauthorstring = formatAuthorstring( myDoc.authors, 4);
   if (myauthorstring.trim().length != 0 ) {
     citestring = myauthorstring + '. ' + citestring;
   }
   $(".sievedoc").append('<div class="card-subtitle mb-2 text-muted">' + citestring + '</div>');
   $(".sievedoc").append('<p class="docabstract">' + myDoc.abstract + '</p>');
   $(".sievedoc").append('<p id="pubmedlink">PMID: <a href="https://www.ncbi.nlm.nih.gov/pubmed/' + pmid + '" target="_pubmedlink">' + pmid + '</a></p>');

 }

 function formatIssuestring(myDoc) {
   if (myDoc.year == "") { var issuestring = myDoc.medlinedate }
   else {
     var issuestring = myDoc.year + " " + myDoc.month + " " + myDoc.day;
   }
   issuestring = issuestring.trim() + "; "
   issuestring = issuestring + myDoc.volume;
   if (myDoc.issue !== "") { issuestring = issuestring + " (" + myDoc.issue + ") " }
   issuestring = issuestring.trim() + ": "
   issuestring = issuestring + myDoc.pages;
   return issuestring;
 }

 function formatAuthorstring(authors, authornumber) {
   if (authors[0] == "") {
     return;
   } else {
     if (authors.length > authornumber) {
       var myauthors = authors.splice(0,authornumber-1).join(', ') + ", et al";
     } else {
       var myauthors = authors.join(', ');
     }
     return myauthors;
   }
 }

 function fetchunsorted() {
   if (sieveDocs.length > 0) {
     showDoc(sieveDocs[getRandomIntInclusive(0, sieveDocs.length-1)]);
   } else {
     setTimeout(fetchunsorted, 50);
   }
 }

 function updateLists() {
   $("#sievelist").empty();
   sieveDocs.length = 0;
   $("#goodlist").empty();
   goodDocs.length = 0;
   $("#badlist").empty();
   badDocs.length = 0;
   $("#skippedlist").empty();
   skipDocs.length = 0;
   var pmids = Object.keys(startDocs)
   for (var i=0; i<pmids.length; i++) {
     polulateLists(pmids[i], startDocs[pmids[i]].sortstatus);
   }
   $("#mehnumber").text(sieveDocs.length);
   $("#goodnumber").text(goodDocs.length);
   $("#badnumber").text(badDocs.length);
   $("#skipnumber").text(skipDocs.length);
 }

 function writeResults(search, searchtotal, totalscreened, good, bad) {
   $("#initialsearchperformance").append("<tr id='startsearch'>");
   $("#startsearch").append("<td style='width:30%'>" + search + "</td>");
   var mysearchstr = "https://www.ncbi.nlm.nih.gov/pubmed?term=" + search;
   $("#startsearch").append('<td style="width:15%"><a href="' + mysearchstr + '" target="_pubmedsearch">' + searchtotal + '</a></td>');
   $("#startsearch").append("<td style='width:15%'>" + totalscreened + "</td>");
   var goodratio = round(good/totalscreened, 3) || 0;
   var goodstring = "(" + goodDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
   var thesegoods = "https://www.ncbi.nlm.nih.gov/pubmed?term=" + goodstring;
   $("#startsearch").append('<td style="width:15%"><a href="' + thesegoods + '" target="_pubmedsearch">' + good + " (" + goodratio + ")</td>");
   var badratio = round(bad/totalscreened, 3) || 0;
   var badstring = "(" + badDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
   var thesebads = "https://www.ncbi.nlm.nih.gov/pubmed?term=" + badstring;
   $("#startsearch").append('<td style="width:15%"><a href="' + thesebads + '" target="_pubmedsearch">' + bad + " (" + badratio + ")</td>");
 }

 function writeVarResults(search, searchtotal, totalscreened, good, bad) {
   $("#variantperformance").append("<tr>");
   $("#variantperformance tr:last").append("<td>" + search + "</td>");
   var encodedsearch = encodeURIComponent(search);
   var mysearchstr = "https://www.ncbi.nlm.nih.gov/pubmed?term=" + encodedsearch;
   $("#variantperformance tr:last").append('<td><a href="' + mysearchstr + '" target="_pubmedsearch">' + searchtotal + '</a></td>');
   var goodstring = "(" + goodDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
   var thesegoods = 'https://www.ncbi.nlm.nih.gov/pubmed?term=' + encodedsearch + ' AND ' + goodstring;
   $("#variantperformance tr:last").append('<td><a href="' + thesegoods + '" target="_pubmedsearch">' + good + "</a></td>");
   var numbermissed = searches["start"].good - good;
   var thesemissed = "https://www.ncbi.nlm.nih.gov/pubmed?term=" + goodstring + " NOT " + '(' + encodedsearch + ')';
   $("#variantperformance tr:last").append('<td><a href="' + thesemissed + '" target="_pubmedsearch">' + numbermissed + "</a></td>");
   var sensitivty = round(good/searches["start"].good, 3) || 0;
   $("#variantperformance tr:last").append("<td>" + sensitivty + "</td>");
   var badstring = "(" + badDocs.map(pmid => pmid + "[PMID]").join(' OR ') + ")";
   var thesebads = 'https://www.ncbi.nlm.nih.gov/pubmed?term=' + encodedsearch + ' AND ' + '(' + badstring + ')';
   $("#variantperformance tr:last").append('<td><a href="' + thesebads + '" target="_pubmedsearch">' + bad + "</a></td>");
   var precision = round(good/(good + bad), 3) || 0;
   $("#variantperformance tr:last").append("<td>" + precision + "</td>");
 }

 function polulateLists(pmid, status) {
   if (status == "Unsorted") {
     sieveDocs.push(pmid);
     listname = "sievelist";
   }
   if (status == "Good") {
     goodDocs.push(pmid);
     listname = "goodlist";
   }
   if (status == "Bad") {
     badDocs.push(pmid);
     listname = "badlist";
   }
   if (status == "Skipped") {
     skipDocs.push(pmid);
     listname = "skippedlist";
   }
   var mylist = "#" + listname;
   var myDoc = startDocs[pmid];
   $(mylist).append('<div class="card listarticle" id=' + pmid + ' >');
   $("#" + pmid).append('<div class="card-body">');
   $("#" + pmid + " .card-body").append('<div class="card-title">' + myDoc.title + '</div>');
   var citestring = '<em>' + myDoc.journalAbbreviation + '</em>. ' + formatIssuestring(myDoc);
   var myauthorstring = formatAuthorstring( myDoc.authors, 2);
   if (myauthorstring.trim().length != 0 ) {
     citestring = myauthorstring+ '. ' + citestring;
   }
   $("#" + pmid + " .card-body").append('<div class="card-subtitle mb-2 text-muted">' + citestring  + '</div>');
   //$(mylist + " .card .card-body").last().append('<a href="#" class="card-link">' + pmid + '</a>')
 }

function getRandomIntInclusive(min, max) {
   min = Math.ceil(min);
   max = Math.floor(max);
   return Math.floor(Math.random() * (max - min + 1)) + min;
 }

function onlyUnique(value, index, self) {
   return self.indexOf(value) === index;
}

function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}
