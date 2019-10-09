function ejemplo_2
% ejemplo_2 es una UI que permite interactuar
% con distintos elementos o componentes 
% uicontrol.

    %  Construcion y ocultamiento de la figura contenedora de la UI.
        f = figure('Visible','off',...
                   'Position',[360,500,450,285]);

    % Construccion de los componentes uicontrol
        hsurf = uicontrol('Style','pushbutton',...
                          'String','Surf',...
                          'Position',[315,220,70,25],...
                          'Callback',@surfbutton_Callback);
                 
        hmesh = uicontrol('Style','pushbutton',...
                          'String','Mesh','Position',[315,180,70,25],...
                          'Callback',@meshbutton_Callback);
                 
        hcontour = uicontrol('Style','pushbutton',...
                             'String','Contour','Position',[315,135,70,25],...
                             'Callback',@contourbutton_Callback);
                 
        htext = uicontrol('Style','text',...
                          'String','Select Data',...
                          'Position',[325,90,60,15]);
               
        hpopup = uicontrol('Style','popupmenu',...
                           'String',{'Peaks','Membrane','Sinc'},...
                           'Position',[300,50,100,25],...
                           'Callback',@popup_menu_Callback);
        
        ha = axes('Units','pixels','Position',[50,60,200,185]);
        
        align([hsurf,hmesh,hcontour,htext,hpopup],'Center','None');

    % Inicializacion de UI.
    % Cambio de unidades de medida para que los componentes se redimensionen.
        f.Units = 'normalized';
        ha.Units = 'normalized';
        hsurf.Units = 'normalized';
        hmesh.Units = 'normalized';
        hcontour.Units = 'normalized';
        htext.Units = 'normalized';
        hpopup.Units = 'normalized';

    % Generacion de datos para el plot.
        peaks_data = peaks(35);
        membrane_data = membrane; % genera logo de MATLAB
        [x,y] = meshgrid(-8:.5:8);
        r = sqrt(x.^2+y.^2) + eps;
        sinc_data = sin(r)./r;

    % Creo un plot en los ejes.
        current_data = peaks_data;
        surf(current_data);

    % Asigno titulo a la figura.
        f.Name = 'GUI Simple';

    % Muevo la figure al centro de la pantalla.
        movegui(f,'center')

    % Hago visible la figure.
        f.Visible = 'on';

    %  Pop-up menu callback. Read the pop-up menu Value property to
    %  determine which item is currently displayed and make it the
    %  current data. This callback automatically has access to 
    %  current_data because this function is nested at a lower level.
       function popup_menu_Callback(source,eventdata) 
          % Determine the selected data set.
          str = get(source, 'String');
          val = get(source,'Value');
          % Set current data to the selected data set.
          switch str{val};
              case 'Peaks' % User selects Peaks.
                 current_data = peaks_data;
              case 'Membrane' % User selects Membrane.
                 current_data = membrane_data;
              case 'Sinc' % User selects Sinc.
                 current_data = sinc_data;
          end
       end

      % Push button callbacks. Each callback plots current_data in the
      % specified plot type.

      function surfbutton_Callback(source,eventdata) 
      % Display surf plot of the currently selected data.
           surf(current_data);
      end

      function meshbutton_Callback(source,eventdata) 
      % Display mesh plot of the currently selected data.
           mesh(current_data);
      end

      function contourbutton_Callback(source,eventdata) 
      % Display contour plot of the currently selected data.
           contour(current_data);
      end
end