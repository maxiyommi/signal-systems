function gui_simple

% GUI_SIMPLE Seleccionar los datos a partir de la selección de un item del 
% menú pop-up, luego elegir tipo de gráfico. Apretando el botón, se grafica
% la data seleccionada en los ejes.

    f = figure('Visible','off','Position',[360 500 450 285]);
    hsurf = uicontrol('Style', 'pushbutton',...
        'String','Surf','Position',[315 220 70 25],...
        'Callback',{@surfbutton_Callback});
    hmesh = uicontrol('Style', 'pushbutton',...
        'String','Mesh','Position',[315 180 70 25],...
        'Callback',{@meshbutton_Callback});
    hcontour = uicontrol('Style', 'pushbutton',...
        'String','Contour','Position',[315 135 70 25],...
        'Callback',{@contourbutton_Callback});
    htext = uicontrol('Style', 'text',...
        'String','Select Data','Position',[325 90 60 15]);
    hpopup = uicontrol('Style', 'popupmenu',...
        'String',{'Peaks','Membrane','Sinc'},'Position',[300 50 100 25],...
        'Callback',{@popup_menu_Callback});
    ha = axes('Units','pixels','Position',[50, 60, 200, 185]);

    % Inicialización de la UI.
    
    f.Units = 'normalized';
    hsurf.Units = 'normalized';
    hmesh.Units = 'normalized';
    hcontour.Units = 'normalized';
    htext.Units = 'normalized';
    hpopup.Units = 'normalized';
    ha.Units = 'normalized';
    
    % Generación de datos para gráfica.
    
    peaks_data = peaks(35);
    membrane_data = membrane;
    [x,y] = meshgrid(-8:.5:8);
    r = sqrt(x.^2+y.^2) + eps;
    sinc_data = sin(r)./r;
    
    % Ploteo.
    
    current_data = peaks_data;
    surf(current_data)

    f.Name = 'GUI Simple';
    movegui(f,'center')
    f.MenuBar = 'none';
    f.NumberTitle = 'off';
    f.Visible = 'on';   
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

    function surfbutton_Callback(source,eventdata)
        surf(current_data);
    end

    function meshbutton_Callback(source,eventdata)
        mesh(current_data);
    end

    function contourbutton_Callback(source,eventdata)
        contour(current_data);
    end

end