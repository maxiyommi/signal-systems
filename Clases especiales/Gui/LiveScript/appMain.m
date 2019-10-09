classdef appMain < matlab.apps.AppBase

    % Properties that correspond to app components
    properties (Access = public)
        UIFigure               matlab.ui.Figure                    % UI Figure
        LabelSlider            matlab.ui.control.Label             % Slider
        Slider                 matlab.ui.control.Slider            % [0 100]
        LabelSemicircularGauge matlab.ui.control.Label             % Semici...
        SemicircularGauge      matlab.ui.control.SemicircularGauge % [0 100]
    end
methods (Access = public)

        function app = appMain()
            % Función constructora
            
            createComponents(app)   % Función que crea los componentes

        end

    end
    methods (Access = private)

        % Slider value changed function
        function SliderValueChanged(app)
            app.SemicircularGauge.Value = app.Slider.Value; 
        end
    end

    % App initialization and construction
    methods (Access = private)

        % Create UIFigure and components
        function createComponents(app)

            % Create UIFigure
            app.UIFigure = uifigure;
            app.UIFigure.Position = [100 100 299 203];
            app.UIFigure.Name = 'UI Figure';
            setAutoResize(app, app.UIFigure, true)

            % Create LabelSlider
            app.LabelSlider = uilabel(app.UIFigure);
            app.LabelSlider.HorizontalAlignment = 'right';
            app.LabelSlider.Position = [40 161 33 15];
            app.LabelSlider.Text = 'Slider';

            % Create Slider
            app.Slider = uislider(app.UIFigure);
            app.Slider.ValueChangedFcn = createCallbackFcn(app, @SliderValueChanged);
            app.Slider.Position = [94 167 150 3];

            % Create LabelSemicircularGauge
            app.LabelSemicircularGauge = uilabel(app.UIFigure);
            app.LabelSemicircularGauge.HorizontalAlignment = 'center';
            app.LabelSemicircularGauge.Position = [95 12 109 15];
            app.LabelSemicircularGauge.Text = 'Semicircular Gauge';

            % Create SemicircularGauge
            app.SemicircularGauge = uigauge(app.UIFigure, 'semicircular');
            app.SemicircularGauge.Position = [89 42 120 65];
        end
    end

    methods (Access = public)

        % Construct app
        function app = App()

            % Create and configure components
            createComponents(app)

            % Register the app with App Designer
            registerApp(app, app.UIFigure)

            % Execute the startup function
            runStartupFcn(app, @startupFcn)

            if nargout == 0
                clear app
            end
        end

        % Code that executes before app deletion
        function delete(app)

            % Delete UIFigure when app is deleted
            delete(app.UIFigure)
        end
    end
end