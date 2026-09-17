# Regenerates assets/character/figure-mask-600.png: the silhouette (head + shirt) that
# lets the profile character move over a static background. Run from the repo root:
#   pwsh scripts/make-figure-mask.ps1
# Segmentation: region-grow from the top/side borders through the smooth blurred
# background (stops at sharp edges and dark hair), plus a blue-chroma rule for the shirt,
# then close/open, hole-fill, keep the largest component, and soften the edge.
param(
  [string]$Src = "assets/character/source/base-no-iris-1254.png",
  [string]$OutMask = "assets/character/figure-mask-600.png",
  [string]$Preview = "assets/character/source/figure-mask-preview.png",
  [int]$Tol = 9,        # max per-channel difference between neighbours for the background to keep growing
  [int]$DarkLimit = 95  # pixels darker than this (max channel) are never background (hair)
)
Add-Type -AssemblyName System.Drawing
$code = @"
using System;
using System.Collections.Generic;
public static class Seg {
  // returns 1 = background, 0 = figure
  public static byte[] Grow(byte[] px,int w,int h,int tol,int darkLimit){
    var bg=new byte[w*h]; var q=new Queue<int>();
    Func<int,int,bool> dark=(x,y)=>{int i=(y*w+x)*4; int m=Math.Max(px[i],Math.Max(px[i+1],px[i+2])); return m<darkLimit;};
    for(int x=0;x<w;x++){ if(!dark(x,0)){bg[x]=1;q.Enqueue(x);} }
    for(int y=0;y<h;y++){ if(!dark(0,y)){bg[y*w]=1;q.Enqueue(y*w);} if(!dark(w-1,y)){bg[y*w+w-1]=1;q.Enqueue(y*w+w-1);} }
    int[] dx={1,-1,0,0}; int[] dy={0,0,1,-1};
    while(q.Count>0){
      int p=q.Dequeue(); int x=p%w, y=p/w; int i=p*4;
      for(int k=0;k<4;k++){
        int nx=x+dx[k], ny=y+dy[k]; if(nx<0||ny<0||nx>=w||ny>=h) continue;
        int n=ny*w+nx; if(bg[n]!=0) continue; int j=n*4;
        if(Math.Abs(px[j]-px[i])>tol||Math.Abs(px[j+1]-px[i+1])>tol||Math.Abs(px[j+2]-px[i+2])>tol) continue;
        if(dark(nx,ny)) continue;
        bg[n]=1; q.Enqueue(n);
      }
    }
    return bg;
  }
  public static byte[] Morph(byte[] m,int w,int h,int r,bool dilate){
    var o=new byte[w*h];
    for(int y=0;y<h;y++) for(int x=0;x<w;x++){
      byte v=dilate?(byte)0:(byte)1;
      for(int yy=Math.Max(0,y-r);yy<=Math.Min(h-1,y+r);yy++) for(int xx=Math.Max(0,x-r);xx<=Math.Min(w-1,x+r);xx++){
        byte s=m[yy*w+xx]; if(dilate){ if(s==1){v=1;} } else { if(s==0){v=0;} }
      }
      o[y*w+x]=v;
    }
    return o;
  }
  // keep only the largest connected figure component (fills isolated background specks too)
  public static byte[] LargestFigure(byte[] figure,int w,int h){
    var lab=new int[w*h]; int best=0,bestSize=0,cur=0; var q=new Queue<int>();
    for(int s=0;s<w*h;s++){ if(figure[s]==0||lab[s]!=0) continue; cur++; int size=0; lab[s]=cur; q.Enqueue(s);
      while(q.Count>0){ int p=q.Dequeue(); size++; int x=p%w,y=p/w;
        int[] ns={p-1,p+1,p-w,p+w}; for(int k=0;k<4;k++){ int n=ns[k]; if(n<0||n>=w*h) continue; if(k==0&&x==0) continue; if(k==1&&x==w-1) continue; if(figure[n]==1&&lab[n]==0){lab[n]=cur;q.Enqueue(n);} } }
      if(size>bestSize){bestSize=size;best=cur;} }
    var o=new byte[w*h]; for(int i=0;i<w*h;i++) o[i]=(byte)(lab[i]==best?1:0); return o;
  }
  // shirt: distinctly bluish pixels (light-blue fabric) — background is neutral grey/warm
  public static byte[] Shirt(byte[] px,int w,int h,int minBR,int minBG,int minMax,int minY){
    var o=new byte[w*h]; for(int i=minY*w;i<w*h;i++){ int j=i*4; int b=px[j],g=px[j+1],r=px[j+2]; int m=Math.Max(r,Math.Max(g,b)); if(b-r>=minBR&&b-g>=minBG&&m>=minMax) o[i]=1; } return o;
  }
  // fill enclosed holes: background is only what touches the image border (excluding the bottom edge, which the figure crosses)
  public static byte[] FillHoles(byte[] figure,int w,int h){
    var bg=new byte[w*h]; var q=new Queue<int>();
    for(int x=0;x<w;x++){ if(figure[x]==0){bg[x]=1;q.Enqueue(x);} }
    for(int y=0;y<h;y++){ if(figure[y*w]==0){bg[y*w]=1;q.Enqueue(y*w);} if(figure[y*w+w-1]==0){bg[y*w+w-1]=1;q.Enqueue(y*w+w-1);} }
    while(q.Count>0){ int p=q.Dequeue(); int x=p%w; int[] ns={p-1,p+1,p-w,p+w}; for(int k=0;k<4;k++){ int n=ns[k]; if(n<0||n>=w*h) continue; if(k==0&&x==0) continue; if(k==1&&x==w-1) continue; if(figure[n]==0&&bg[n]==0){bg[n]=1;q.Enqueue(n);} } }
    var o=new byte[w*h]; for(int i=0;i<w*h;i++) o[i]=(byte)(bg[i]==1?0:1); return o;
  }
  public static float[] Blur(byte[] m,int w,int h,int r){
    var a=new float[w*h]; var b=new float[w*h]; for(int i=0;i<w*h;i++) a[i]=m[i];
    for(int y=0;y<h;y++) for(int x=0;x<w;x++){ float s=0; int c=0; for(int xx=Math.Max(0,x-r);xx<=Math.Min(w-1,x+r);xx++){s+=a[y*w+xx];c++;} b[y*w+x]=s/c; }
    for(int y=0;y<h;y++) for(int x=0;x<w;x++){ float s=0; int c=0; for(int yy=Math.Max(0,y-r);yy<=Math.Min(h-1,y+r);yy++){s+=b[yy*w+x];c++;} a[y*w+x]=s/c; }
    return a;
  }
}
"@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Collections
$Src=(Resolve-Path $Src).Path; $OutMask=[System.IO.Path]::GetFullPath($OutMask); $Preview=[System.IO.Path]::GetFullPath($Preview)
$bmp = New-Object System.Drawing.Bitmap $Src
$w=$bmp.Width;$h=$bmp.Height
$d0=$bmp.LockBits((New-Object System.Drawing.Rectangle 0,0,$w,$h),[System.Drawing.Imaging.ImageLockMode]::ReadOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$px=New-Object byte[] ($d0.Stride*$h); [System.Runtime.InteropServices.Marshal]::Copy($d0.Scan0,$px,0,$px.Length); $bmp.UnlockBits($d0)
$bg = [Seg]::Grow($px,$w,$h,$Tol,$DarkLimit)
$shirt = [Seg]::Shirt($px,$w,$h,30,22,120,930)
$fig = New-Object byte[] ($w*$h); for($i=0;$i -lt $fig.Length;$i++){ $fig[$i] = [byte]([int](1 - $bg[$i]) -bor [int]$shirt[$i]) }
# close (bridge fabric texture), open (drop thin leaks), fill enclosed holes, keep the main figure
$fig = [Seg]::Morph($fig,$w,$h,6,$true); $fig = [Seg]::Morph($fig,$w,$h,6,$false)
$fig = [Seg]::FillHoles($fig,$w,$h)
$fig = [Seg]::LargestFigure($fig,$w,$h)
$soft = [Seg]::Blur($fig,$w,$h,3)
$figCount=0; foreach($v in $fig){ if($v -eq 1){$figCount++} }
"figure coverage: $([math]::Round(100*$figCount/($w*$h),1))% of the image"
# write full-res mask (alpha = figure) then downsample to 600
$maskFull = New-Object System.Drawing.Bitmap $w,$h,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$d=$maskFull.LockBits((New-Object System.Drawing.Rectangle 0,0,$w,$h),[System.Drawing.Imaging.ImageLockMode]::WriteOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$out = New-Object byte[] ($d.Stride*$h)
for($i=0;$i -lt $w*$h;$i++){ $a=[byte][math]::Round(255*$soft[$i]); $o=$i*4; $out[$o]=255;$out[$o+1]=255;$out[$o+2]=255;$out[$o+3]=$a }
[System.Runtime.InteropServices.Marshal]::Copy($out,0,$d.Scan0,$out.Length); $maskFull.UnlockBits($d)
$m600 = New-Object System.Drawing.Bitmap 600,600,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[System.Drawing.Graphics]::FromImage($m600); $g.InterpolationMode='HighQualityBicubic'; $g.Clear([System.Drawing.Color]::Transparent); $g.DrawImage($maskFull,0,0,600,600); $g.Dispose()
$m600.Save($OutMask,[System.Drawing.Imaging.ImageFormat]::Png)
# preview: figure on magenta
$prev = New-Object System.Drawing.Bitmap 600,600; $g=[System.Drawing.Graphics]::FromImage($prev); $g.Clear([System.Drawing.Color]::Magenta)
$photo = New-Object System.Drawing.Bitmap 600,600; $g2=[System.Drawing.Graphics]::FromImage($photo); $g2.InterpolationMode='HighQualityBicubic'; $g2.DrawImage($bmp,0,0,600,600); $g2.Dispose()
for($y=0;$y -lt 600;$y++){ for($x=0;$x -lt 600;$x++){ $a=$m600.GetPixel($x,$y).A; if($a -gt 0){ $c=$photo.GetPixel($x,$y); $prev.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(255,[int](($c.R*$a+255*(255-$a))/255),[int](($c.G*$a)/255),[int](($c.B*$a+255*(255-$a))/255))) } } }
$g.Dispose(); $prev.Save($Preview,[System.Drawing.Imaging.ImageFormat]::Png)
"mask saved: $OutMask ($((Get-Item $OutMask).Length) bytes); preview: $Preview"
$bmp.Dispose();$maskFull.Dispose();$m600.Dispose();$prev.Dispose();$photo.Dispose()
