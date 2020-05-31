function script9
% Funcion Front-end.
    
    f = figure('Name','Base de datos de materiales','NumberTitle','off','WindowStyle','modal','Position',[300 300 690 350],'Visible','off');
    
    columnname  = {'Materiales','125 [Hz]','250 [Hz]','500 [Hz]','1000 [Hz]','2000 [Hz]','4000 [Hz]','8000 [Hz]'};
    columnformat = {'char','numeric','numeric','numeric','numeric','numeric','numeric','numeric'};
    
    aux = readtable('materiales.txt');
    d = table2cell(aux);
    
    t = uitable('Data',d,...
                'Parent',f,...
                'ColumnName',columnname ,...
                'ColumnFormat', columnformat,...
                'ColumnEditable', true,...
                'RowName',[]);

    t.Position(3) = t.Extent(3);
    t.Position(4) = t.Extent(4); 
    
    btn = uicontrol('Style', 'pushbutton', 'String', 'Agregar',...
        'Position', [630 80 50 50],...
        'Callback', {@agregar,t});
    
    f.Visible = 'on';
    
    function agregar(hObject, eventdata, t)
    % Funcion Back-end.  
    
        aux2 = t.Data;
        aux3 = {'',0,0,0,0,0,0,0};
        T = [aux2;aux3];
        
        writetable(cell2table(T),'materiales.txt','Delimiter',' ');
        t.Data = T;   
        t.Position(3) = t.Extent(3);
    end

end