class VoteOption {
    constructor(id, percentage,data, animSpeed) {
        this.animSpeed = animSpeed;
        
        if ($(`#${id}`).length == 0) {
            //---------------------------------------------
            //  Generate new Options
            //---------------------------------------------
            var newOption = `<li id="${id}" class="option">`;
            newOption += `<div class="optionName">${data.options[id].Key} <span>(!vote ${id})</span>`;
            newOption += `<div id="vote_${id}" class="percentage">${percentage}</div></div>`;
            newOption += `<div class="optionBar"><span class="bgBar">&nbsp;</span><span id="vote__${id}" class="progressBar" style="width: ${percentage}%;">&nbsp;</span>`;
            newOption += `</div></li>`;

            this.newUserObject = $($.parseHTML(newOption));
            this.percentage = percentage;
        }
        return null;
    }

    update(id,percentage,data) {
        this.percentage = percentage;
        console.log(id);
        $(`#_${id} .optionName`).html(`${data.options[id].Key} <span>(!vote ${id})</span>`);
        $(`#vote_${id}`).html(`${percentage}%`);
        $(`#vote__${id}`).width(`${percentage}%`);      
    }

    animate(id,percentage) {
        $(`#vote_${id}`).animate({
                html: `${percentage.toFixed(2)}%`
                },{
                duration: this.animSpeed,
                queue: true,
                step: function(now, tween){
                    $(`#${this.id}`).html(`${now.toFixed(2)}%`);
                }});

        $(`#vote__${id}`).animate({
                width: `${percentage.toFixed(2)}%`
                },{
                duration: this.animSpeed,
                queue: true,
                step: function(now, tween){
                }});
    }
}