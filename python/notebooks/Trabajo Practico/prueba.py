import numpy as np
from matplotlib import pyplot as plt
import pandas as pd
from scipy.io.wavfile import write

#Modificar la funcion para que la cantidad de valores generados dependa de una duracion en segundos y la fs

def voss(nrows, ncols=16):
    """
    Genera ruido rosa utilizando el algoritmo de Voss-McCartney(https://www.dsprelated.com/showabstract/3933.php).
    
    nrows: numero de valores a generar
    rcols: numero de fuentes a aleatorias a agregar
    
    returns: NumPy array
    """
    array = np.full((nrows, ncols), np.nan)
    array[0, :] = np.random.random(ncols)
    array[:, 0] = np.random.random(nrows)
    
    # el numero total de cambios es nrows
    n = nrows
    cols = np.random.geometric(0.5, n)
    cols[cols >= ncols] = 0
    rows = np.random.randint(nrows, size=n)
    array[rows, cols] = np.random.random(n)
    
    #Implementacion del foward fill en numpy
#     mask = np.isnan(array)
#     idx = np.where(~mask,np.arange(mask.shape[1]),0)
#     np.maximum.accumulate(idx,axis=1, out=idx)
#     array[mask] = array[np.nonzero(mask)[0], idx[mask]]
#     total = np.sum(array,axis=1)
    
    df = pd.DataFrame(array)
    filled = df.fillna(method='ffill', axis=0)
    total = filled.sum(axis=1)
    

    ## Centrado de el array en 0
    total = total - total.mean()
    
    ## Normalizado
    valor_max = max(abs(max(total)),abs(min(total)))
    total = total / valor_max
    
    return total

data = voss(nrows=44100*5, ncols=16)
write('prueba.wav', 44100, data)  # Save as WAV file 
#Agregar codigo que pida por consola los valores, ejecute la funcion y grafique el resultado