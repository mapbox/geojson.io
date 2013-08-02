// Download as file
function download(container, editor) {
    var button = container.append('button').on('click', saveAsFile);
    button.append('span').attr('class', 'icon icon-download');


}
