using System;
using System.IO;
using System.Threading;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;

public static class VideoThumb
{
    public static string Capture(string videoPath, string outputPath)
    {
        Exception threadEx = null;
        string result = "NO_OUTPUT";
        Thread t = new Thread(new ThreadStart(delegate()
        {
            try
            {
                MediaPlayer player = new MediaPlayer();
                player.Open(new Uri(videoPath));
                Thread.Sleep(2000);
                int w = player.NaturalVideoWidth;
                int h = player.NaturalVideoHeight;
                if (w <= 0 || h <= 0)
                {
                    result = "INVALID_SIZE";
                    return;
                }
                DrawingVisual visual = new DrawingVisual();
                using (DrawingContext dc = visual.RenderOpen())
                {
                    dc.DrawVideo(player, new Rect(0, 0, w, h));
                }
                RenderTargetBitmap bmp = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
                bmp.Render(visual);
                PngBitmapEncoder encoder = new PngBitmapEncoder();
                encoder.Frames.Add(BitmapFrame.Create(bmp));
                using (FileStream fs = File.Open(outputPath, FileMode.Create))
                {
                    encoder.Save(fs);
                }
                player.Close();
                result = outputPath;
            }
            catch (Exception ex)
            {
                threadEx = ex;
            }
        }));
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
        if (threadEx != null) throw threadEx;
        return result;
    }
}
