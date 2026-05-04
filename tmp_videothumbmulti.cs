using System;
using System.IO;
using System.Threading;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;

public static class VideoThumbMulti
{
    public static string Capture(string videoPath, string outputDir)
    {
        Exception threadEx = null;
        string result = "NO_OUTPUT";
        Thread t = new Thread(new ThreadStart(delegate()
        {
            try
            {
                Directory.CreateDirectory(outputDir);
                MediaPlayer player = new MediaPlayer();
                player.Open(new Uri(videoPath));
                Thread.Sleep(2500);
                int w = player.NaturalVideoWidth;
                int h = player.NaturalVideoHeight;
                if (w <= 0 || h <= 0)
                {
                    result = "INVALID_SIZE";
                    return;
                }
                double[] times = new double[] { 1, 3, 5, 8, 12 };
                foreach (double sec in times)
                {
                    player.Position = TimeSpan.FromSeconds(sec);
                    Thread.Sleep(800);
                    DrawingVisual visual = new DrawingVisual();
                    using (DrawingContext dc = visual.RenderOpen())
                    {
                        dc.DrawVideo(player, new Rect(0, 0, w, h));
                    }
                    RenderTargetBitmap bmp = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
                    bmp.Render(visual);
                    PngBitmapEncoder encoder = new PngBitmapEncoder();
                    encoder.Frames.Add(BitmapFrame.Create(bmp));
                    string path = Path.Combine(outputDir, "frame_" + sec.ToString().Replace('.', '_') + ".png");
                    using (FileStream fs = File.Open(path, FileMode.Create))
                    {
                        encoder.Save(fs);
                    }
                }
                player.Close();
                result = outputDir;
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
