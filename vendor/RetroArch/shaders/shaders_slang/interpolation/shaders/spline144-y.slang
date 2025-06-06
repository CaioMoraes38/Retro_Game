#version 450

/*
	Spline144 - PassY - by Hyllian 2025

	Spline144 math sources: https://web.archive.org/web/20181105121248/http://www.geocities.jp/w_bean17/spline.html

	Adapted from bicubic xbmx source shaders below.
*/



/*
   Copyright (C) 2010 Team XBMC
   http://www.xbmc.org
   Copyright (C) 2011 Stefanos A.
   http://www.opentk.com

This Program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2, or (at your option)
any later version.

This Program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with XBMC; see the file COPYING.  If not, write to
the Free Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.
http://www.gnu.org/copyleft/gpl.html
*/


layout(push_constant) uniform Push
{
	vec4 SourceSize;
	vec4 OriginalSize;
	vec4 OutputSize;
	uint FrameCount;
	float S144_ANTI_RINGING;
} params;

#pragma parameter S144_ANTI_RINGING "Spline144 Anti-Ringing [ OFF | ON ]" 1.0 0.0 1.0 1.0

#define S144_ANTI_RINGING params.S144_ANTI_RINGING

#define AR_STRENGTH 0.8

layout(std140, set = 0, binding = 0) uniform UBO
{
	mat4 MVP;
} global;

#pragma stage vertex
layout(location = 0) in vec4 Position;
layout(location = 1) in vec2 TexCoord;
layout(location = 0) out vec2 vTexCoord;

void main()
{
   gl_Position = global.MVP * Position;
   vTexCoord = TexCoord  + vec2(0.0001, 0.0001);;
}

#pragma stage fragment
layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 0, binding = 2) uniform sampler2D Source;


float weight(float x)
{
	x = abs(x);

	if (x < 1.0)
	{
		return
			(
			 ( (    683.0/571.0  * x -  1240203.0/ 564719.0 ) * x -  3.0/ 564719.0  ) * x + 1.0
			);
	}
	else if ((x >= 1.0) && (x < 2.0))
	{
		return
			(
			 ( (   -336.0/571.0  * x +  1783152.0/ 564719.0 ) * x -  3023328.0/ 564719.0  ) * x + 1572480.0/ 564719.0
			);
	}
	else if ((x >= 2.0) && (x < 3.0))
	{
		return
			(
			 ( (     90.0/571.0  * x -   744660.0/ 564719.0 ) * x +  2032110.0/ 564719.0  ) * x - 1797660.0/ 564719.0
			);
	}
	else if ((x >= 3.0) && (x < 4.0))
	{
		return
			(
			 ( (   - 24.0/571.0  * x +   269784.0/ 564719.0 ) * x -  1010256.0/ 564719.0  ) * x + 1243584.0/ 564719.0
			);
	}
	else if ((x >= 4.0) && (x < 5.0))
	{
		return
			(
			 ( (      6.0/571.0  * x -    85248.0/ 564719.0 ) * x +   405258.0/ 564719.0  ) * x -  636840.0/ 564719.0
			);
	}
	else if ((x >= 5.0) && (x < 6.0))
	{
		return
			(
			 ( (   -  1.0/571.0  * x +    17175.0/ 564719.0 ) * x -    98926.0/ 564719.0  ) * x +  188880.0/ 564719.0
			);
	}
	else
	{
		return 0.0;
	}
}

vec4 weight4(float x)
{
	return vec4(
			weight(x - 2.0),
			weight(x - 1.0),
			weight(x),
			weight(x + 1.0)
		   );
}

	

void main()
{
    vec2 ps = params.SourceSize.zw;
    vec2 pos = vTexCoord.xy + ps * vec2(0.0, 0.5);
    vec2 fp = fract(pos / ps);

    vec2 xystart = (-5.5 - fp) * ps + pos;

    float xpos = xystart.x  + ps.x * 6.0;

    vec3 C0 = texture(Source, vec2(xpos, xystart.y             )).rgb;
    vec3 C1 = texture(Source, vec2(xpos, xystart.y + ps.y      )).rgb;
    vec3 C2 = texture(Source, vec2(xpos, xystart.y + ps.y * 2.0)).rgb;
    vec3 C3 = texture(Source, vec2(xpos, xystart.y + ps.y * 3.0)).rgb;
    vec3 C4 = texture(Source, vec2(xpos, xystart.y + ps.y * 4.0)).rgb;
    vec3 C5 = texture(Source, vec2(xpos, xystart.y + ps.y * 5.0)).rgb; 
    vec3 C6 = texture(Source, vec2(xpos, xystart.y + ps.y * 6.0)).rgb; 
    vec3 C7 = texture(Source, vec2(xpos, xystart.y + ps.y * 7.0)).rgb; 
    vec3 C8 = texture(Source, vec2(xpos, xystart.y + ps.y * 8.0)).rgb; 
    vec3 C9 = texture(Source, vec2(xpos, xystart.y + ps.y * 9.0)).rgb; 
    vec3 CA = texture(Source, vec2(xpos, xystart.y + ps.y *10.0)).rgb; 
    vec3 CB = texture(Source, vec2(xpos, xystart.y + ps.y *11.0)).rgb; 

    vec4 w1 = weight4(-3.0 - fp.y);
    vec4 w2 = weight4( 1.0 - fp.y);
    vec4 w3 = weight4( 5.0 - fp.y);

    vec3 color = mat4x3( C0, C1, C2, C3 ) * w1 + mat4x3( C4, C5, C6, C7 ) * w2 + mat4x3( C8, C9, CA, CB ) * w3;

    color /= dot(w1+w2+w3, vec4(1));

    // Anti-ringing
    if (S144_ANTI_RINGING == 1.0)
    {
        vec3 aux = color;
        vec3 min_sample = min(min(C4, C5), min(C6, C7));
        vec3 max_sample = max(max(C4, C5), max(C6, C7));
        color = clamp(color, min_sample, max_sample);
        color = mix(aux, color, step(0.0, (C4-C5)*(C6-C7)));
    }

    FragColor = vec4(color, 1.0);
}
