function circuitoRC_v2
%CIRCUITORC_V2 Filtro pasa-bajos básico.
%   Con este programa se puede visualizar la transferencia de tensión
%   de un filtro pasa-bajos pasivo de primer orden.
      
R = 100;

C = 32*10^(-6);

f = 50;

Vg = 1;

vout = sym(0);
        
% Los componentes de la UI están en esta estructura.
hs = creacion_de_componentes;

    function hs = creacion_de_componentes
        hs.fh = figure('MenuBar', 'none', 'Name', 'Circuito RC', ...
            'NumberTitle', 'off', 'Resize', 'off', ...
            'Units', 'normalized');
        
        hs.pan1 = uipanel(hs.fh, 'Units', 'normalized', ...
        'Position', [0.02 0.15 0.37 0.67]);

        hs.tVg = uicontrol(hs.fh, 'Style', 'text', ...
            'Units', 'normalized', 'Position', ...
            [0.1 0.6 0.05 0.05], 'String', 'Vg');
    
        hs.vg = uicontrol(hs.fh, 'Style', 'edit', ...
            'Units', 'normalized', 'Position', ...
            [0.15 0.6 0.1 0.05], 'Callback', ...
            @cambiar_vg);
        
        hs.tf = uicontrol(hs.fh, 'Style', 'text', ...
            'Units', 'normalized', 'Position', ...
            [0.1 0.5 0.05 0.05], 'String', 'f');

        hs.f = uicontrol(hs.fh, 'Style', 'edit', ...
            'Units', 'normalized', 'Position', ...
            [0.15 0.5 0.1 0.05], 'Callback', ...
            @cambiar_f);
        
        hs.tR = uicontrol(hs.fh, 'Style', 'text', ...
            'Units', 'normalized', 'Position', ...
            [0.1 0.4 0.05 0.05], 'String', 'R');

        hs.R = uicontrol(hs.fh, 'Style', 'edit', ...
            'Units', 'normalized', 'Position', ...
            [0.15 0.4 0.1 0.05], 'Callback', ...
            @cambiar_R);
        
        hs.tC = uicontrol(hs.fh, 'Style', 'text', ...
            'Units', 'normalized', 'Position', ...
            [0.1 0.3 0.05 0.05], 'String', 'C');

        hs.C = uicontrol(hs.fh, 'Style', 'edit', ...
            'Units', 'normalized', 'Position', ...
            [0.15 0.3 0.1 0.05], 'Callback', ...
            @cambiar_C);
        
        hs.play = uicontrol(hs.fh, 'Style', 'pushbutton',...
            'String', 'Graficar', ...
            'Callback', @transferencia, ...
            'Units', 'normalized', ...
            'Position', [0.1 0.17 0.2 0.1 ]);
        
        hs.text1 = uicontrol(hs.fh, 'Style', 'text', ...
            'String', 'Este programa visualiza las tensiones de entrada y salida de un filtro RC básico.', ...
            'Units', 'normalized', 'Position', [0.44 0.8 0.5 0.08]);
        
        hs.text2 = uicontrol(hs.fh, 'Style', 'text', ...
        'String', 'Debe ingresar el valor de resistencia, de capacidad, de tensión eficaza de entrada y una frecuencia de oscilacións.', ...
        'Units', 'normalized', 'Position', [0.05 0.7 0.3 0.1]);
    
        hs.ax = axes('Parent', hs.fh, 'Units', 'normalized',...
            'Position', [0.48 0.25 0.4 0.5], ...
            'NextPlot', 'replacechildren', ...
            'Title', 'Tensión de entrada vs. Tensión de salida');          
    end

    function transferencia(hObject, callbackdata)
        
        s = sym('s');
        
        t = sym('t');
        
        w = 2*sym(pi)*f;
        
        vin = Vg*sqrt(2)*sin(sym(w)*t);

        Vin(s) = laplace(vin);

        H(s) = (1/(R*C))/(1/(R*C)+s);

        Vout(s) = Vin*H;

        vout(t) = ilaplace(Vout);

        ezplot(vin,[0 2/f])

        hold on
        
        ezplot(vout, [0 2/f])
        
        ylim([-1.1*Vg*sqrt(2) 1.1*Vg*sqrt(2)])
        
        title('Tensión de entrada vs. Tensión de salida')
        
        xlabel('Tiempo [s]')
        
        hold off
        
    end

    function cambiar_vg(hObject, callbackdata)
        
       Vg = str2num(hs.vg.String);
       
       if isempty(Vg)
           
           Vg = 1;
           
           errordlg('No está permitido ese valor. Se ajustó al valor por defecto. ')
       end
        
    end

    function cambiar_f(hObject, callbackdata)
        
       f = str2num(hs.f.String);
       
       if isempty(f)
           
           f = 50;
           
           errordlg('No está permitido ese valor. Se ajustó al valor por defecto. ')
       
       end
    end

    function cambiar_R(hObject, callbackdata)
        
       R = str2num(hs.R.String);
       
       if isempty(R)
           
           R = 100;
           
           errordlg('No está permitido ese valor. Se ajustó al valor por defecto. ')
        
       elseif R == 0;
               
               R = 0.1;
           
       end
       
    end

    function cambiar_C(hObject, callbackdata)
        
       C = str2num(hs.C.String);
       
       if isempty(C)
           
           C = 0.000032;
           
           errordlg('No está permitido ese valor. Se ajustó al valor por defecto. ')
       elseif C == 0;
           
           C = 0.00000000001;
       end
        
    end

end

