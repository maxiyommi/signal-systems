function miui3()
    mivar1 = 5;
    mivar2 = 10;
    figure;
    uicontrol('Style', 'pushbutton', ...
        'String', '5 + 10', ...
        'Callback', {@pushbutton_callback, mivar1, mivar2});
end

function pushbutton_callback(hObject, callbackdata, x, y)
    display(x + y)  
end

