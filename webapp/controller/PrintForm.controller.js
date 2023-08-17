sap.ui.define([
   "./BaseController",
   "../model/html2pdf.bundle"
], function (BaseController, com) {
   "use strict";

   return BaseController.extend("com.tolaram.app.pp.zppcartoncreat.controller.PrintForm", {

      onInit: function () {
         var btn = document.getElementById("btn");
         /*btn.addEventListener("click", () => {           
            this.__onPrintFullForm();
         })*/

         this._initialDisplay();
         //this.__onFormCreate();
      },
      _initialDisplay: function () {
         document.getElementById("form").style.display = "none";
         //document.getElementById("btn").style.display = "none";
         //document.getElementById("span").style.display = "none";
      },

      onClickPdfView: function () {
         var that = this;
         var element = document.getElementById("form");
         /*var header = document.getElementById("headerSet");*/
         /*html2pdf(element);*/



         var fileName = "PrintForm";
         console.log(fileName);

         var opt = {
            margin: [10, 10, 30, 10], //top, left, buttom, right,
            filename: fileName,
            image: {
               type: 'jpeg',
               quality: 0.98
            },
            html2canvas: {
               dpi: 192,
               scale: 5,
               letterRendering: true
            },
            pagebreak: {
               mode: 'css',
               after: '#nextPage'
            },
            jsPDF: {
               unit: 'pt',
               format: 'a4',
               orientation: 'portrait'
            }
         };


         html2pdf().from(element).set(opt).toPdf().get("pdf").then((pdf) => {

            console.log(pdf);
            var totalPages = pdf.internal.getNumberOfPages();
            console.log(totalPages);

            /*debugger;*/
            for (var i = 1; i <= totalPages; i++) {

               pdf.setPage(i);
               pdf.setFontSize(11);
               pdf.setTextColor(100);
               pdf.text('Page ' + i + ' of ' + totalPages, (pdf.internal.pageSize.getWidth() / 2.25), (pdf.internal.pageSize.getHeight() - 8));

            }

         }).save();

      },
      __onPrintFullForm: function (oEvent) {

         var oPrintData = this.getOwnerComponent().getModel("printModel").getData();
         var sResourceId = oPrintData.ResourceID;
         var sProcessorder = oPrintData.Processorder;
         var sPostingDate = oPrintData.PostingDate;
         var sMaterial = oPrintData.Material;
         var sMaterialName = oPrintData.MaterialName;
         var sTargetQuantity = oPrintData.TargetQuantity;
         var sUnit = oPrintData.Unit;
         var sProcessorder = oPrintData.Processorder;
         var sBatch = oPrintData.Batch
         var sCartonid = oPrintData.CartonId;
         var sNormt = oPrintData.Normt;
         var sLoanz = oPrintData.Loanz;  
         var sPrintDate = oPrintData.PrintDate;   
         var detailCode = "Hello Tolaram, QR Code is not generated correctly";
         if (sResourceId !== "" && sProcessorder !== "" && sPostingDate !== "" && sMaterial !== "" && sMaterialName !== "" && sTargetQuantity !== "" && sUnit !== "") {
            //var code = '/RESOURCE:' + sResourceId + '/PROCESS:' + sProcessorder + '/MATERIAL:' + sMaterial + '/TARGET:' + sTargetQuantity + '/UNIT:' + sUnit + '';
            var code = sCartonid;
            detailCode = code.replace(/[/:]/g, "");
         }
         var qrCodeUrl = "https://chart.googleapis.com/chart?cht=qr&chl=" + detailCode + "&chs=160x160&chld=L|0";

         var pageHeader = document.getElementById("span");
         /*console.log(pageHeader);*/
         pageHeader.innerText = `Form Print`;

         //document.getElementById("form").innerHTML =
         var stringHTML =
            `<!DOCTYPE html>
                <html lang="en">
                   <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <link rel="stylesheet" href="style.css" />
                      <title>Carton print</title>
                      <style>
                         .cntrBox {
                         text-align: center;
                         border: 1px solid black;
                         !margin: 15px;
                         }
                         .textsizeNo {
                         font-size: 11rem;
                         font-weight: bold;
                         }
                         .headertext {
                         font-family: sans-serif;
                         font-size: 20px;
                         font-weight: bold;
                         display: inline-block;
                         }
                         #container {
                         text-align: center;
                         border: 1px solid black;
                         margin: 15px;
                         overflow: hidden;
                         !width: 359px;
                         !height:359px;
                         !width: 700px;
                         !height:300px;
                         }
                         #inner {
                         overflow: hidden;
                         width: 100%;
                         !margin: 20px;
                         }
                         .childInner{
                         padding-top:50px;
                         }
                         .child {
                         float: left;
                         width: 55%;
                         height: 100%;
                         }
                         .child2 {
                         float: left;
                         width: 45%;
                         height: 100%;
                         }
                      </style>
                   </head>
                   <body>
                      <div id="main">
                         <div id="container">
                            <div id="inner">
                               <div class="child">
                                  <div class="childInner">
                                     <div class="headertext">${sMaterialName}</div>
                                     <div class="headertext">P.D:&nbsp;${sPrintDate}</div><div class="headertext">${sBatch}</div><div class="headertext">&nbsp;&nbsp;${sLoanz}</div>
                                     <div >
                                        <img id="newQrcode" src='${qrCodeUrl}'/>
                                     </div>
                                     <div class="headertext">${sCartonid}</div>
                                  </div>
                               </div>
                               <div class="child2">
                                  <div class="textsizeNo">${sNormt}</div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </body>
                </html>`;


         var ctrlString = "width=380px,height=380px";
         var wind = window.open("", "PrintWindow", ctrlString);

         if (wind !== undefined) {
            wind.document.write(stringHTML);
         }
         // Creating a small time delay so that the layout renders
         setTimeout(function () {
            wind.print();
            wind.close();

         }, 500);


      }

   });

});