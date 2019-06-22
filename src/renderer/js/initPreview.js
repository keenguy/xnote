/* prevent a click event from firing after dragging the window */

window.addEventListener('load', function () {
    var isMouseDown = false
    var isDragging = false
    var distance = 0

    document.body.addEventListener('mousedown', function () {
        isMouseDown = true
        isDragging = false
        distance = 0
    })

    document.body.addEventListener('mouseup', function () {
        isMouseDown = false
    })

    var dragHandles = document.getElementsByClassName('windowDragHandle')

    for (var i = 0; i < dragHandles.length; i++) {
        dragHandles[i].addEventListener('mousemove', function (e) {
            if (isMouseDown) {
                isDragging = true
                distance += Math.abs(e.movementX) + Math.abs(e.movementY)
            }
        })
    }

    document.body.addEventListener('click', function (e) {
        if (isDragging && distance >= 10.0) {
            e.stopImmediatePropagation()
            isDragging = false
        }
    }, true)
})

require('./webviews.js')