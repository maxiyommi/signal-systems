function varargout = ejemplo_1(varargin)
% EJEMPLO_1 MATLAB code for ejemplo_1.fig
%      EJEMPLO_1, by itself, creates a new EJEMPLO_1 or raises the existing
%      singleton*.
%
%      H = EJEMPLO_1 returns the handle to a new EJEMPLO_1 or the handle to
%      the existing singleton*.
%
%      EJEMPLO_1('CALLBACK',hObject,eventData,handles,...) calls the local
%      function named CALLBACK in EJEMPLO_1.M with the given input arguments.
%
%      EJEMPLO_1('Property','Value',...) creates a new EJEMPLO_1 or raises the
%      existing singleton*.  Starting from the left, property value pairs are
%      applied to the GUI before ejemplo_1_OpeningFcn gets called.  An
%      unrecognized property name or invalid value makes property application
%      stop.  All inputs are passed to ejemplo_1_OpeningFcn via varargin.
%
%      *See GUI Options on GUIDE's Tools menu.  Choose "GUI allows only one
%      instance to run (singleton)".
%
% See also: GUIDE, GUIDATA, GUIHANDLES

% Edit the above text to modify the response to help ejemplo_1

% Last Modified by GUIDE v2.5 28-Sep-2017 10:29:55

% Begin initialization code - DO NOT EDIT
gui_Singleton = 1;
gui_State = struct('gui_Name',       mfilename, ...
                   'gui_Singleton',  gui_Singleton, ...
                   'gui_OpeningFcn', @ejemplo_1_OpeningFcn, ...
                   'gui_OutputFcn',  @ejemplo_1_OutputFcn, ...
                   'gui_LayoutFcn',  [] , ...
                   'gui_Callback',   []);
if nargin && ischar(varargin{1})
    gui_State.gui_Callback = str2func(varargin{1});
end

if nargout
    [varargout{1:nargout}] = gui_mainfcn(gui_State, varargin{:});
else
    gui_mainfcn(gui_State, varargin{:});
end
% End initialization code - DO NOT EDIT


% --- Executes just before ejemplo_1 is made visible.
function ejemplo_1_OpeningFcn(hObject, eventdata, handles, varargin)
% This function has no output args, see OutputFcn.
% hObject    handle to figure
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% varargin   command line arguments to ejemplo_1 (see VARARGIN)

% Create the data to plot.
    handles.peaks = peaks(35);
    handles.membrane = membrane;
    [x,y] = meshgrid(-8:.5:8);
    r = sqrt(x.^2+y.^2) + eps;
    sinc = sin(r)./r;
    handles.sinc = sinc;
    
% Set the current data value.
    handles.current_data = handles.peaks;
    surf(handles.current_data)
    
% Choose default command line output for ejemplo_1
    handles.output = hObject;

% Update handles structure
    guidata(hObject, handles);

% UIWAIT makes ejemplo_1 wait for user response (see UIRESUME)
% uiwait(handles.figure1);


% --- Outputs from this function are returned to the command line.
function varargout = ejemplo_1_OutputFcn(hObject, eventdata, handles) 
% varargout  cell array for returning output args (see VARARGOUT);
% hObject    handle to figure
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Get default command line output from handles structure
varargout{1} = handles.output;


% --- Executes on button press in pushbutton1.
function pushbutton1_Callback(hObject, eventdata, handles)
% hObject    handle to pushbutton1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% Display surf plot of the currently selected data.
    surf(handles.current_data); 

% --- Executes on button press in pushbutton2.
function pushbutton2_Callback(hObject, eventdata, handles)
% hObject    handle to pushbutton2 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% Display mesh plot of the currently selected data.
    mesh(handles.current_data);

% --- Executes on button press in pushbutton3.
function pushbutton3_Callback(hObject, eventdata, handles)
% hObject    handle to pushbutton3 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% Display contour plot of the currently selected data.
    contour(handles.current_data);

% --- Executes on selection change in popupmenu1.
function popupmenu1_Callback(hObject, eventdata, handles)
% hObject    handle to popupmenu1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Determine the selected data set.
    str = get(hObject, 'String'); % cell array, con el contenido del menu.
    val = get(hObject,'Value'); % el indice en el menu de los datos seleccionados.
    
% Set current data to the selected data set.
    switch str{val};
    case 'peaks' % User selects peaks.
       handles.current_data = handles.peaks;
    case 'membrane' % User selects membrane.
       handles.current_data = handles.membrane;
    case 'sinc' % User selects sinc.
       handles.current_data = handles.sinc;
    end
    
% Save the handles structure.
    guidata(hObject,handles)  
    
% Hints: contents = cellstr(get(hObject,'String')) returns popupmenu1 contents as cell array
%        contents{get(hObject,'Value')} returns selected item from popupmenu1


% --- Executes during object creation, after setting all properties.
function popupmenu1_CreateFcn(hObject, eventdata, handles)
% hObject    handle to popupmenu1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    empty - handles not created until after all CreateFcns called 

% Hint: popupmenu controls usually have a white background on Windows.
%       See ISPC and COMPUTER.
if ispc && isequal(get(hObject,'BackgroundColor'), get(0,'defaultUicontrolBackgroundColor'))
    set(hObject,'BackgroundColor','white');
end
