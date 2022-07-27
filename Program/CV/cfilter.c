#include <Python.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>

// dont forget to free the memory after using the arrays
static Py *cFilter(int width, int height, int imgIn[height][width][3], int red[3], int rTolerance, int green[3], int gTolerance, int wall[3], int wTolerance)
{
    int imgOut[height][width][3];
    memset(imgOut, 0, sizeof imgOut);
    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            if (abs(imgIn[y][x][2]-red[0]) < rTolerance && abs(imgIn[y][x][1]-red[1]) < rTolerance && abs(imgIn[y][x][0]-red[2]) < rTolerance)
            {
                imgOut[height][width]
            }
        }
    }
}