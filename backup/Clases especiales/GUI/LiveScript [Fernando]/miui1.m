function miui1
    % Construcción de componentes.
    hs = conComponentes;

    % Se establece visible la figura luego de la creación de componentes.
    hs.fig.Visible = 'on';

    function hs = conComponentes
        
        casa=0;
        
        hs.fig = figure('Visible', 'off',...
        'Resize', 'off', 'Tag', 'fig');
    
        hs.btn = uicontrol(hs.fig, 'Position', [10, 340 70 30], ...
            'String', 'Plot line', ...
            'Tag', 'Button', ...
            'Callback', {@plotsine,casa});
        
        hs.ax = axes(hs.fig, 'Position', [0.2 0.13 0.71 0.75], ...
            'Tag', 'ax');
    end

    function plotsine(hObject, callbackdata, casa)
        theta = 0:pi/64:6*pi;
        y = sin(theta);
        plot(hs.ax, theta, y)
    end

end