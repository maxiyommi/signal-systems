function popup_menu_Callback(source, eventdata)
   str = source.String;
   val = source.Value;
   switch str{val}
       case 'Peaks'
           current_data = peaks_data;
       case 'Membrane'
           current_data = membrane_data;
       case 'Sinc'
           current_data = sinc_data;
   end
end