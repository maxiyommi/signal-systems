function miui2()
    figure
    uicontrol('Style','Slider','Callback',@display_slider_value);

    function display_slider_value(hObject, callbackdata)
        newval = num2str(hObject.Value);
        disp(['Slider moved to ' newval]);
    end
    
end