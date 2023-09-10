//! Variable to change max number of iteration in collision detection and repair algorithm (EDIT VIA BROWSER CONSOLE)
let maxIterations = 100;



//! Main app
window.onload = () => {

    //! Global variables
    const SALBP_BTN = document.querySelector("#SALBP_picker");
    const SALBP_Info = document.querySelector("#SALBP_type")
    const solveBTN = document.querySelector("#solveBTN");
    const copyBTN = document.querySelector("#copyBTN");
    const sourceBTN = document.querySelector("#sourceBTN");
    const sourceWRAP = document.querySelector("#sourceWrapper");
    const sourceTXTAREA = document.querySelector("#source");
    const notificationELEM = document.querySelector("#notification");
    const highlight = document.querySelector("#highlight");
    const fileInput = document.querySelector("#filePicker");
    const limitInputLabel = document.querySelector("#limitPickerDesc");
    const limitInput = document.querySelector("#limitPicker");
    const methodInput = document.querySelector("#methodPicker");
    const ganttChartsWrapper = document.querySelector("#ganttChartsWrapper");
    const solutionInforTaskAmount = document.querySelector("#taskAmount");
    const solutionType = document.querySelector("#solutionType h4");
    const solutionInfoC = document.querySelector("#solutionInfoC h4");
    const solutionInfoHeuristic = document.querySelector("#solutionInfoHeuristic h4");
    const solutionInfoK = document.querySelector("#solutionInfoK h4");
    const solutionInfoLE = document.querySelector("#solutionInfoLE h4");
    const solutionInfoSI = document.querySelector("#solutionInfoSI h4");
    const solutionInfoT = document.querySelector("#solutionInfoT h4");

    let Data = []; // Array of input data (objects) created by createDataObject()
    let Lines = []; // Array of line data (objects) created by createLineObject()
    let nodesStorage = [-1]; // Array of graph nodes (DOM elements)
    let typeSALBP = 1;
    let highlightCurrLine = 0;
    let error = false;
    let LinesNotValid = true;
    let LineErrorNode; // End graph node of line with detected collision (DOM element)
    let ColumnNodeSwitches = 0; // Counter of node position swaps in a column - switchNodes()
    let solutionData = []; // Array of tasks (IDs) after prioritization
    let cyclesLineup = []; // Array of task (objects) placed in cycles
    let cyclesLineupTimes = [0]; //Array of space(time) used in each cycle
    let optimalSolution = false;
    let currentDate = new Date;


    //! Copyright Year Update
    document.querySelector("#copyrightYear").innerText = currentDate.getFullYear();


    //! Window resize handler
    window.onresize = () => {
        setTimeout(() => {
            clearConnections();

            if (error) {
                highlightLineUpdate(false, highlightCurrLine);
            } else {
                generateConnections();
                console.clear();
            }
        }, 300);
    };


    //! SALBP choice handler
    SALBP_BTN.addEventListener("click", () => {
        if (typeSALBP != 1) {
            SALBP_Info.innerText = "SALBP-1";
            limitInputLabel.innerText = "Enter cycle time";
            typeSALBP = 1;
            notificationUpdate('SALBP-1 selected!', 1500);
        } else {
            SALBP_Info.innerText = "SALBP-2";
            limitInputLabel.innerText = "Enter number of stations";
            typeSALBP = 2;
            notificationUpdate('SALBP-2 selected!', 1500);
        }
    });


    //! File input handler
    fileInput.addEventListener("change", () => {
        let fr = new FileReader();

        highlight.style.opacity = 0;

        fr.readAsText(fileInput.files[0]);
        fr.onload = () => {
            document.querySelector("#source").value = fr.result;
            notificationUpdate('Data loaded form file!', 1500);
        }
    });


    //! "Copy data" button handler
    copyBTN.addEventListener("click", (event) => {
        event.preventDefault();

        sourceTXTAREA.select();
        sourceTXTAREA.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(sourceTXTAREA.value);

        notificationUpdate('Data copied to clipboard!', 1500);
    });


    //! "Solve problem" button handler
    solveBTN.addEventListener("click", (event) => {
        event.preventDefault();

        Data = [];
        solutionData = [];
        nodesStorage = [-1];
        LinesNotValid = true;

        clearConnections();
        clearVisualization();

        parseSourceData();
        appendData();

        let loopTerminator = 0;
        while (LinesNotValid && loopTerminator < maxIterations) {
            Lines = [];

            clearConnections();
            generateConnections();

            loopTerminator++;
            if (LinesNotValid && loopTerminator < maxIterations) {
                switchNodes(LineErrorNode);
            }
        }

        if (loopTerminator == maxIterations) {
            highlightLineUpdate(true);
            clearVisualization();
            errorHandler();
            notificationUpdate('Graph cannot be created correctly!', 2000);
            throw new Error("Graph cannot be created correctly - Increase max number of algorithm iterations");
        }

        appendNodeTime();

        ganttChartsWrapper.innerHTML = "";
        solutionData = [];
        cyclesLineup = [];
        cyclesLineupTimes = [0];
        BLMsolver();

        sourceBTN.classList.remove("hide");
        sourceWRAP.classList.add("hide");

        if (optimalSolution) {
            notificationUpdate('Optimal solution found!', 1500);
        } else {
            notificationUpdate('Suboptimal solution found!', 1500);
        }
    })


    //! Menu button handler
    sourceBTN.addEventListener("click", () => {
        if (!error) {
            if (sourceWRAP.classList.contains("hide")) {
                sourceWRAP.classList.remove("hide");
                sourceBTN.innerText = "Hide data panel";
            } else {
                sourceWRAP.classList.add("hide");
                sourceBTN.innerText = "Change data";
            }
        }
    })


    //! Notification handler
    function notificationUpdate(notice, time) {
        notificationELEM.querySelector("p").innerText = notice;
        notificationELEM.style.opacity = 1;
        notificationELEM.style.pointerEvents = "auto";

        setTimeout(() => {
            notificationELEM.style.opacity = 0;
            notificationELEM.style.pointerEvents = "none";
        }, time);
    }


    //! Error handling function
    function errorHandler() {
        error = true;
        Data = [];
        nodesStorage = [-1];

        clearConnections();
        clearVisualization();
    }


    //! Highlight line in textarea function
    function highlightLineUpdate(hideHighlight, i) {
        if (!hideHighlight) {
            let pos = sourceTXTAREA.getBoundingClientRect();
            highlight.style.top = (pos.top + 30 + (i * 25.2)) + "px";
            highlight.style.left = (pos.left + 30) + "px";
            highlight.style.opacity = 0.3;
            highlightCurrLine = i;
        } else {
            highlight.style.top = 0;
            highlight.style.left = 0;
            highlight.style.opacity = 0;
        }
    }


    //! Connection clearing function
    function clearConnections() {
        let nodeConnection = document.querySelectorAll(".leader-line");

        nodeConnection.forEach(e => {
            e.remove();
        });
    }


    //! Data parsing function
    function parseSourceData() {
        let sourceData = sourceTXTAREA.value;

        if (sourceData.length == 0) {
            highlightLineUpdate(true);
            errorHandler();
            notificationUpdate('No input data!', 1500);
            throw new Error("No input data");
        }

        // Check if source data ends correctly
        if (sourceData.charAt(sourceData.length - 1) == "]") {
            sourceData = sourceTXTAREA.value + ",";
        } else {
            highlightLineUpdate(false, sourceData.split("\n").length - 1);
            errorHandler();
            notificationUpdate('Incorrect input data ending!', 2000);
            throw new Error("Inccorect end of last line");
        }

        sourceData = sourceData.split("\n");

        for (let i = 0; i < sourceData.length; i++) {
            validateSourceData(sourceData[i], i, sourceData.length);

            for (let j = 0; j < sourceData[i].length; j++) {
                if (sourceData[i].charAt(j) == "[") {
                    let tmp = sourceData[i].slice(j, sourceData[i].length - 1).replaceAll(" ", ""); // Get and format succs/preds data array
                    sourceData[i] = sourceData[i].slice(0, j); // Get data without succs/preds data array
                    sourceData[i] += tmp;
                    sourceData[i] = sourceData[i].replace('"', "").replaceAll('"', "").split(" "); // Format and convert input string to array of separate elements
                }
            }

            Data[i] = createDataObject(sourceData[i]);
        }
        solutionInforTaskAmount.innerText = "Tasks amount: " + sourceData.length;

        //! Data validation function
        function validateSourceData(data, i, dataLength) {


            //! Data structure check
            let regex = /([0-9]{1,} [0-9]{1,} (\"succs\"|\"preds\"){1} \[[0-9]{1,}((, [0-9]{1,}){0,})\]{1},{1})/i;;

            if (!regex.test(data)) {
                highlightLineUpdate(false, i);
                errorHandler();

                notificationUpdate('Incorrect input data structure - Line ' + (i + 1), 2000);
                throw new Error("Inccorect data structure - Line " + (i + 1));
            }


            //! Task ID check
            let currIndex = 0;
            let dataIDtmp = data.slice(currIndex, data.length);
            let dataID = "";

            for (let j = 0; j < dataIDtmp.length; j++) {
                currIndex++;
                if (dataIDtmp.charAt(j) == " ") {
                    break;
                } else {
                    dataID += dataIDtmp[j];
                }
            }

            if (parseInt(dataID) != (i + 1)) {
                highlightLineUpdate(false, i);
                errorHandler();
                notificationUpdate('Incorrect task number - Line ' + (i + 1), 2000);
                throw new Error("Inccorect task number - Line " + (i + 1));
            }


            //! Task TIME check
            let dataTIMEtmp = data.slice(currIndex, data.length);
            let dataTIME = "";

            for (let j = 0; j < dataTIMEtmp.length; j++) {
                currIndex++;
                if (dataTIMEtmp.charAt(j) == " ") {
                    break;
                } else {
                    dataTIME += dataTIMEtmp[j];
                }
            }

            if (parseInt(dataTIME) == 0) {
                highlightLineUpdate(false, i);
                errorHandler();
                notificationUpdate('Incorrect task time (null) - Line ' + (i + 1), 2000);
                throw new Error("Inccorect task time (null) - Line " + (i + 1));
            }

            let dataTYPE = data.slice(currIndex + 1, currIndex + 6); // Get data type (succs/preds)

            //! Task NODES check
            currIndex += 9; // Added to skip past "succs"/"preds" and [
            let dataNODEtmp = data.slice(currIndex, data.length).replaceAll(" ", ""); // Get and format succs/preds array beginning with first node's ID
            let dataNODE = "";

            for (let j = 0; j < dataNODEtmp.length; j++) {
                if (dataNODEtmp.charAt(j) == "," || dataNODEtmp.charAt(j) == "]") {
                    if (parseInt(dataNODE) > dataLength) {
                        highlightLineUpdate(false, i);
                        errorHandler();
                        notificationUpdate('Incorrect succs / preds input (not existing) - Line ' + (i + 1), 2000);
                        throw new Error("Inccorect succs / preds input (not existing) - Line " + (i + 1));
                    }

                    if (parseInt(dataNODE) == dataID) {
                        highlightLineUpdate(false, i);
                        errorHandler();
                        notificationUpdate('Incorrect succs / preds input (identical to ID) - Line ' + (i + 1), 2000);
                        throw new Error("Inccorect succs / preds input (identical to ID) - Line " + (i + 1));
                    }

                    if ((dataTYPE == "succs" && parseInt(dataNODE) < dataID) || (dataTYPE == "preds" && parseInt(dataNODE) > dataID)) {
                        highlightLineUpdate(false, i);
                        errorHandler();
                        notificationUpdate('Incorrect succs / preds input (wrong task order) - Line ' + (i + 1), 2000);
                        throw new Error("Inccorect succs / preds input (wrong task order) - Line " + (i + 1));
                    }
                    dataNODE = "";
                } else {
                    dataNODE += dataNODEtmp[j];
                }
            }

            highlightLineUpdate(true);
            error = false;
        }


        //! Data object creation function
        function createDataObject(data) {
            return {
                ID: parseInt(data[0]),
                time: parseInt(data[1]),
                type: data[2],
                nodes: JSON.parse(data[3]),
                prevNodes: []
            };
        }
    }


    //! Data to HTML structure input function
    function appendData() {
        clearVisualization();

        let lastColumn = 0;
        let body = document.querySelector("#visualizationWrapper");

        for (let i = 0; i < Data.length * 2; i++) {
            body.innerHTML += '<div class="nodesColumn"></div>';
        }

        let nodesColumns = document.querySelectorAll(".nodesColumn");

        defaultNodeAppend(Data[0], lastColumn);

        for (let d = 1; d < Data.length; d++) {
            let nodeExists = [-1]; // Array of column numbers of existing nodes in the format: [ID, SUCCS/PREDS ID]

            // Check if node with ID exists in HTML
            if (findNode(Data[d].ID) != -1) {
                nodeExists[0] = findNode(Data[d].ID);
            }

            // Check if succs/preds exists in HTML
            for (let i = 0; i < Data[d].nodes.length; i++) {
                if (findNode(Data[d].nodes[i]) != -1) {
                    nodeExists[i + 1] = findNode(Data[d].nodes[i]);
                } else {
                    nodeExists[i + 1] = -1;
                }
            }

            if (nodeExists.every((val) => val === -1)) {
                defaultNodeAppend(Data[d], lastColumn);
                continue;
            }

            if (nodeExists[0] != -1) {
                for (let i = 0; i < Data[d].nodes.length; i++) {
                    if (nodeExists[i + 1] == -1) {
                        NodeAppendController(Data[d].nodes[i], Data[d].type, nodeExists[0], 1);
                    }
                }
            } else {
                for (let i = 0; i < Data[d].nodes.length; i++) {
                    if (nodeExists[i + 1] != -1) {
                        NodeAppendController(Data[d].ID, Data[d].type, nodeExists[i + 1], -1);
                    }
                }
            }
        }

        for (let i = 0; i < nodesColumns.length; i++) {
            let clmNodes = nodesColumns[i].querySelectorAll(".node span");

            if (clmNodes.length == 0) {
                nodesColumns[i].remove();
            }
        }

        updateNodesStorage();


        //! Function to check if node exists in HTML structure and return its column number
        function findNode(idNum) {
            for (let i = 0; i < nodesColumns.length; i++) {
                let clmNodes = nodesColumns[i].querySelectorAll(".node span");

                if (clmNodes.length != 0) {
                    for (let j = 0; j < clmNodes.length; j++) {
                        if (clmNodes[j].innerText == idNum) {
                            return i;
                        }
                    }
                }
            }
            return -1;
        }


        //! Function to append node at its first appearance without any succs/preds
        function defaultNodeAppend(data, index) {
            if (data.type == "succs") {
                nodesColumns[index].innerHTML += '<div class="node"><span>' + data.ID + '</span><p class="time"></p></div>';

                for (let i = 0; i < data.nodes.length; i++) {
                    nodesColumns[index + 1].innerHTML += '<div class="node"><span>' + data.nodes[i] + '</span><p class="time"></p></div>';
                }
            } else {
                nodesColumns[index + 1].innerHTML += '<div class="node"><span>' + data.ID + '</span><p class="time"></p></div>';

                for (let i = 0; i < data.nodes.length; i++) {
                    nodesColumns[index].innerHTML += '<div class="node"><span>' + data.nodes[i] + '</span><p class="time"></p></div>';
                }
            }
        }


        //! Function to append node at its first appearance
        function NodeAppendController(data, type, index, idSwitch) {
            if (type == "succs") {
                appendNode(data, index + idSwitch);
            } else {
                appendNode(data, index - idSwitch);
            }

            function appendNode(d, i) {
                if (i < 0) {
                    i = 0;
                }

                lastColumn = i;
                nodesColumns[i].innerHTML += '<div class="node"><span>' + d + '</span><p class="time"></p></div>';
            }
        }


        //! Nodes storage update function (DOM Elements)
        function updateNodesStorage() {
            for (let j = 0; j < nodesColumns.length; j++) {
                let columnNodeElements = nodesColumns[j].querySelectorAll(".node");

                for (let n = 0; n < columnNodeElements.length; n++) {
                    nodesStorage[parseInt(columnNodeElements[n].innerText)] = columnNodeElements[n];
                }
            }
        }
    }


    //! HTML structure flush function
    function clearVisualization() {
        let nodesColumns = document.querySelectorAll(".nodesColumn");

        nodesColumns.forEach(e => {
            e.innerHTML = "";
        });
    }


    //! Connections (arrows) generating function
    function generateConnections() {
        for (let d = 0; d < Data.length; d++) {
            for (let i = 0; i < Data[d].nodes.length; i++) {

                // IF to prevent lines in reverse directions
                if (Data[d].ID < Data[d].nodes[i]) {
                    Lines.push(createLineObject(nodesStorage[Data[d].ID], nodesStorage[Data[d].nodes[i]]));

                    if (!validateLine(Lines[Lines.length - 1])) {
                        LinesNotValid = true;
                        return;
                    } else {
                        LinesNotValid = false;
                        new LeaderLine(nodesStorage[Data[d].ID], nodesStorage[Data[d].nodes[i]], {
                            size: 4,
                            path: 'straight',
                            endPlug: 'arrow3',
                            color: '#dddddd',
                            endPlugSize: 1.5
                        });
                    }
                }
            }
        }


        //! Connection colision detection function
        function validateLine(currentLine) {
            if (currentLine.startNode.top == currentLine.endNode.top || currentLine.startNode.left == currentLine.endNode.left) {
                return true;
            } else {
                if (window.screen.width > 1025) {
                    for (let i = 0; i < Lines.length - 1; i++) {
                        if ((currentLine.startNode.top < Lines[i].startNode.top && currentLine.endNode.top > Lines[i].endNode.top) || (currentLine.startNode.top > Lines[i].startNode.top && currentLine.endNode.top < Lines[i].endNode.top)) {
                            if ((currentLine.startNode.left == Lines[i].startNode.left && currentLine.endNode.left == Lines[i].endNode.left)) {
                                LineErrorNode = currentLine.end;
                                return false;
                            }
                        }
                    }
                } else {
                    for (let i = 0; i < Lines.length - 1; i++) {
                        if ((currentLine.startNode.left < Lines[i].startNode.left && currentLine.endNode.left > Lines[i].endNode.left) || (currentLine.startNode.left > Lines[i].startNode.left && currentLine.endNode.left < Lines[i].endNode.left)) {
                            if ((currentLine.startNode.top == Lines[i].startNode.top && currentLine.endNode.top == Lines[i].endNode.top)) {
                                LineErrorNode = currentLine.end;
                                return false;
                            }
                        }
                    }
                }
                return true;
            }
        }


        //! Data object creation function
        function createLineObject(start, end) {
            return {
                start: start,
                end: end,
                startNode: start.getBoundingClientRect(),
                endNode: end.getBoundingClientRect()
            };
        }
    }


    //! Graph nodes position swapping function
    function switchNodes(node) {
        let parent = node.parentNode;
        if (ColumnNodeSwitches < parent.childElementCount) {
            parent.insertBefore(parent.lastChild, parent.firstChild);
            ColumnNodeSwitches++;
        } else {
            let randNum = Math.floor(Math.random() * (parent.childElementCount));
            parent.insertBefore(parent.children[randNum], parent.firstChild);
        }
    }


    //! Task time input function
    function appendNodeTime() {
        let nodesColumns = document.querySelectorAll(".nodesColumn");

        for (let j = 0; j < nodesColumns.length; j++) {
            let columnNodeElements = nodesColumns[j].querySelectorAll(".node span");
            let columnNodeElementsTime = nodesColumns[j].querySelectorAll(".node .time");

            for (let n = 0; n < columnNodeElements.length; n++) {
                columnNodeElementsTime[n].innerText += Data[parseInt(columnNodeElements[n].innerText) - 1].time;
            }
        }
    }


    //! BLM problem solver function
    function BLMsolver() {
        if (limitInput.value < 0 && typeSALBP == 1) {
            errorHandler();
            notificationUpdate('Incorrect c value (not positive)', 1500);
            throw new Error("Incorrect c value (not positive)");
        } else if (limitInput.value < 0 && typeSALBP == 2) {
            errorHandler();
            notificationUpdate('Incorrect K value (not positive)', 1500);
            throw new Error("Incorrect K value (not positive)");
        }

        if (limitInput.value == 0 && typeSALBP == 1) {
            errorHandler();
            notificationUpdate('Incorrect c value (null)', 1500);
            throw new Error("Incorrect c value (null)");
        } else if (limitInput.value == 0 && typeSALBP == 2) {
            errorHandler();
            notificationUpdate('Incorrect K value (null)', 1500);
            throw new Error("Incorrect K value (null)");
        }

        switch (methodInput.selectedIndex) {
            case 0:
                WETsolver();
                break;
            case 1:
                RPWsolver();
                break;
            case 2:
                NOFsolver();
                break;
            case 3:
                NOIFsolver();
                break;
        }

        let c;

        if (typeSALBP == 1) {
            c = limitInput.value;
            SALBP1_lineupSolver(solutionData);
            optimalSolution = true;
        } else if (typeSALBP == 2) {
            SALBP2_search();
        }

        generateGanttCharts();
        calculateQualityIndicators();

        solutionType.innerHTML = "SALBP-" + typeSALBP;
        solutionInfoHeuristic.innerText = methodInput.options[methodInput.selectedIndex].text;
        solutionInfoC.innerText = "c = " + c;
        solutionInfoK.innerText = "K = " + cyclesLineup.length;


        //! WET method prioritization solver function
        function WETsolver() {
            Data.sort((a, b) => {
                return b.time - a.time;
            });

            Data.forEach(e => {
                solutionData.push(e.ID);
            });
        }


        //! RPW method prioritization solver function
        function RPWsolver() {
            let rankedPositionalWeight = [];
            let taskTimesCount;

            for (let i = 0; i < Data.length; i++) {
                taskTimesCount = 0;
                taskTimesCount = countRPW(i);

                rankedPositionalWeight[i] = {
                    ID: i + 1,
                    RPW: taskTimesCount
                }
            }

            rankedPositionalWeight.sort((a, b) => {
                return b.RPW - a.RPW;
            });

            rankedPositionalWeight.forEach(e => {
                solutionData.push(e.ID);
            });

            function countRPW(start) {
                let currentTaskTimes = new Array(Data.length).fill(0);;
                if (Data[start].type == 'succs') {

                    if (Data[start].nodes.length == 1) {
                        currentTaskTimes[0] += Data[start].time;
                        currentTaskTimes[0] += countRPW(Data[start].nodes[0] - 1);
                        return currentTaskTimes[0];
                    } else {
                        Data[start].nodes.forEach((e, index) => {
                            currentTaskTimes[index] += Data[start].time;
                            currentTaskTimes[index] += countRPW(e - 1);
                        });
                    }
                    return Math.max(...currentTaskTimes);

                } else {
                    return Data[start].time;
                }
            }
        }


        //! NOF method prioritization solver function
        function NOFsolver() {
            let numberOfFollowers = [];
            const visited = new Set();
            let followersCount;

            for (let i = 0; i < Data.length; i++) {
                followersCount = 0;
                visited.clear();
                countNOF(i);

                numberOfFollowers[i] = {
                    ID: i + 1,
                    NOF: followersCount
                }
            }

            numberOfFollowers.sort((a, b) => {
                return b.NOF - a.NOF;
            });

            numberOfFollowers.forEach(e => {
                solutionData.push(e.ID);
            });

            function countNOF(start) {
                if (!visited.has(start)) {
                    visited.add(start);
                    if (Data[start].type == 'succs') {
                        followersCount++;
                        Data[start].nodes.forEach(e => {
                            countNOF(e - 1);
                        });
                    } else {
                        return;
                    }
                }
            }
        }


        //! NOIF method prioritization solver function
        function NOIFsolver() {
            let numberOfImmediateFollowers = [];
            for (let i = Data.length - 1; i >= 0; i--) {
                if (Data[i].type == "preds") {
                    numberOfImmediateFollowers[i] = {
                        ID: i + 1,
                        NOIF: 0
                    }
                } else {
                    numberOfImmediateFollowers[i] = {
                        ID: i + 1,
                        NOIF: Data[i].nodes.length
                    }
                }
            }

            numberOfImmediateFollowers.sort((a, b) => {
                return b.NOIF - a.NOIF;
            });

            numberOfImmediateFollowers.forEach(e => {
                solutionData.push(e.ID);
            });
        }


        //! SALBP1 solver function
        function SALBP1_lineupSolver(solutionData) {
            Data.sort((a, b) => {
                return a.ID - b.ID;
            });
            updateDataObjects();

            const done = new Set();
            let currentLineup = [];
            let dataToRemove = [];
            let M = 0;
            let moveToNextcycle = false;
            let solutionDataComparator = 0;

            // Sequence constraints check
            while (solutionData.length > 0) {

                solutionDataComparator = solutionData.length;

                for (let i = 0; i < solutionData.length; i++) {

                    let check = 0; // Flag to check if previous nodes are done

                    // Not first node check
                    if (Data[solutionData[i] - 1].prevNodes.length != 0) {

                        // Check if previous nodes are done
                        Data[solutionData[i] - 1].prevNodes.forEach(e => {
                            if (done.has(e)) {
                                check++;
                            } else {
                                check--
                            }
                        });

                        // If task is available check cycle's space
                        if (Data[solutionData[i] - 1].prevNodes.length == check) {
                            let success = cyclesSpaceCheck(Data[solutionData[i] - 1], i);
                            if (success) {
                                break;
                            }
                        }
                    } else {
                        let success = cyclesSpaceCheck(Data[solutionData[i] - 1], i);
                        if (success) {
                            break;
                        }
                    }
                }

                // Remove finished tasks
                solutionData = solutionData.filter(x => !dataToRemove.includes(x));

                // Check if solutionData changed
                if (solutionDataComparator == solutionData.length) {
                    moveToNextcycle = true;
                }
            }

            // Add last cycle if any data was left
            if (currentLineup.length != 0) {
                cyclesLineup.push(currentLineup);
            }


            //! Data object updating function
            function updateDataObjects() {
                Data.forEach(e => {
                    if (e.type == 'preds') {
                        e.prevNodes = e.nodes;
                        e.nodes = [];
                    } else {
                        e.nodes.forEach(node => {
                            Data[node - 1].prevNodes.push(e.ID);
                        });
                    }
                });
            }


            //! Cycle space and task fit checking function
            function cyclesSpaceCheck(availableTask, i) {

                // New cycle creation check
                if (cyclesLineupTimes[M] == c || moveToNextcycle) {
                    M++;
                    cyclesLineupTimes[M] = 0;
                    cyclesLineup.push(currentLineup);
                    currentLineup = [];
                    moveToNextcycle = false;
                }

                // Task time fit check 
                if (cyclesLineupTimes[M] + availableTask.time <= c) {
                    cyclesLineupTimes[M] += availableTask.time;
                    currentLineup.push(availableTask);

                    done.add(solutionData[i]);
                    dataToRemove.push(solutionData[i]);

                    return true;
                }

                return false;
            }
        }


        //! SALBP2 search function
        function SALBP2_search() {

            // Lower bound calculation
            const t_sum = Data.reduce((accumulator, object) => {
                return accumulator + object.time;
            }, 0);
            const t_max = Math.max(...Data.map(object => {
                return object.time;
            }));

            c = Math.max(Math.round(t_sum / limitInput.value), t_max);
            console.log("LB " + c);


            // Upper bound calculation
            let UB = 0;
            if (limitInput.value % 2 == 0) {
                UB = Math.max(t_max, Math.round((2 * Data.reduce((accumulator, object) => {
                    return accumulator + (object.time - 1);
                }, 0)) / parseInt(limitInput.value)));
            } else {
                UB = Math.max(t_max, Math.round((2 * t_sum) / (parseInt(limitInput.value) + 1)));
            }
            console.log("UB " + UB);


            //! Lower bound search method 
            SALBP1_lineupSolver(solutionData);

            // Optimal solution check
            let allSolutions = [];
            allSolutions.push([c, cyclesLineup.length]);
            while (c < UB) {
                if (cyclesLineup.length == limitInput.value) {
                    optimalSolution = true;
                    break;
                } else {
                    optimalSolution = false;
                    c++;
                    cyclesLineup = [];
                    cyclesLineupTimes = [0];

                    SALBP1_lineupSolver(solutionData);
                    allSolutions.push([c, cyclesLineup.length]);
                }
            }


            // Suboptimal solution handler
            let suboptimalSolution = [0, 0];
            allSolutions.forEach((e, n) => {
                if (e[1] <= limitInput.value) {
                    if (e[1] > suboptimalSolution[1]) {
                        suboptimalSolution[0] = e[0];
                        suboptimalSolution[1] = e[1];
                    }
                }
            });

            c = suboptimalSolution[0];
            cyclesLineup = [];
            cyclesLineupTimes = [0];
            SALBP1_lineupSolver(solutionData);
        }

        //! Gantt charts generating function
        function generateGanttCharts() {

            for (i = 0; i < cyclesLineup.length; i++) {
                let currentCanvas = document.createElement("canvas");
                ganttChartsWrapper.appendChild(currentCanvas);

                let currentChart = new Chart(
                    currentCanvas, {
                        type: 'bar',
                        options: {
                            indexAxis: 'y',
                            scales: {
                                x: {
                                    stacked: true,
                                    max: parseInt(c),
                                    grid: {
                                        color: "#e0e0e0"
                                    },
                                    ticks: {
                                        color: "#000",
                                        font: {
                                            size: 18,
                                            family: "Poppins"
                                        }
                                    },
                                    border: {
                                        color: "#000"
                                    }
                                },
                                y: {
                                    stacked: true,
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        color: "#000",
                                        font: {
                                            size: 30,
                                            family: "Poppins",
                                            weight: 500
                                        }
                                    },
                                    border: {
                                        color: "#000"
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    position: "bottom",
                                    labels: {
                                        font: {
                                            size: 20,
                                            family: "Poppins",
                                            weight: 600
                                        },
                                        color: "#000",
                                    }
                                },
                                tooltip: {
                                    padding: 15,
                                    xAlign: "right",
                                    yAlign: "center",
                                    bodyFont: {
                                        size: 16,
                                        family: "Poppins",
                                        weight: 600
                                    },
                                    callbacks: {
                                        title: () => null,
                                        label: function (context) {
                                            return " Task time: " + context.dataset.data;
                                        }
                                    }
                                }
                            },
                        },

                        data: {
                            labels: ["Cycle " + (i + 1) + " "],

                            datasets: []
                        }
                    }
                );

                for (j = 0; j < cyclesLineup[i].length; j++) {
                    addData(currentChart, cyclesLineup[i][j].ID, cyclesLineup[i][j].time, randomColorGenerator());
                }
            }

            function randomColorGenerator() {
                const hex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'F'];
                let randomColor = "#";

                for (var j = 0; j < 6; j++) {
                    randomColor += hex[Math.floor(Math.random() * hex.length)]
                }

                return randomColor
            }

            function addData(chart, label, data, color) {
                const newData = {
                    label: label,
                    data: [data],
                    backgroundColor: color
                }

                chart.data.datasets.push(newData);
                chart.update();
            }

        }


        //! Quality indicators calculating function
        function calculateQualityIndicators() {
            let lineEfficiency = 0;
            let smoothnessIndex = 0;
            let lineTime = 0;
            let tmpSum = 0;


            //Line time calculation
            lineTime = cyclesLineupTimes.length * c;
            solutionInfoT.innerText = "T = " + lineTime;


            //Line efficiency calculation
            cyclesLineupTimes.forEach(e => {
                tmpSum += e;
            });
            lineEfficiency = (tmpSum / (lineTime)) * 100;
            solutionInfoLE.innerText = "LE = " + lineEfficiency.toFixed(2) + "%";


            //Smoothness index calculation
            tmpSum = 0;
            cyclesLineupTimes.forEach(e => {
                tmpSum += Math.pow(c - e, 2);
            });
            smoothnessIndex = Math.sqrt(tmpSum);
            solutionInfoSI.innerText = "SI = √(" + tmpSum + ") = " + smoothnessIndex.toFixed(2);
        }
    }
};