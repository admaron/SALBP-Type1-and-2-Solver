function lineupSolver() {
    Data.sort((a, b) => {
        return a.ID - b.ID;
    });
    updateDataObjects();

    const done = new Set();
    let machinesLineup = [0];
    let machinesLineupTimes = [0];
    let M = 0;

    // Sequence constraints check
    while (solutionData.length > 0) {
        for (let i = 0; i < solutionData.length; i++) {

            let check = 0; // Flag to check if previous nodes are done

            // First node check
            if (Data[solutionData[i] - 1].prevNodes.length != 0) {

                // Check if previous nodes are done
                Data[solutionData[i] - 1].prevNodes.forEach(e => {
                    if (done.has(e)) {
                        check++;
                    } else {
                        check--
                    }
                });

                if (Data[solutionData[i] - 1].prevNodes.length == check) {
                    machinesSpaceCheck(Data[solutionData[i] - 1]);
                    done.add(solutionData[i]);
                    solutionData.splice(i, 1);
                    break;
                }
            } else {
                machinesSpaceCheck(Data[solutionData[i] - 1]);
                done.add(solutionData[i]);
                solutionData.splice(i, 1);
                break;
            }
        }
    }
    console.log

    function machinesSpaceCheck(avaiableTask) {
        if (machinesLineupTimes[M] + avaiableTask.time <= cInput.value) {
            machinesLineup[M].push(avaiableTask);
            console.log("Tak");
        } else {
            M++;
            machinesLineup[M].push(avaiableTask);
            console.log("Nie, nowa");
        }
    }


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
}