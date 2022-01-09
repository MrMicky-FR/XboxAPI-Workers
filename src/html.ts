export default `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="A fast and simple Xbox Live API, built on Cloudflare Workers.">
    <title>XboxAPI Workers</title>
    <link rel="icon" sizes="any" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23107c10' d='M28.895,63.207c-4.821,-0.462 -9.701,-2.192 -13.893,-4.928c-3.513,-2.291 -4.305,-3.234 -4.305,-5.114c-0,-3.777 4.152,-10.393 11.258,-17.933c4.034,-4.284 9.654,-9.302 10.262,-9.167c1.182,0.264 10.63,9.48 14.167,13.819c5.593,6.858 8.163,12.475 6.857,14.979c-0.993,1.904 -7.154,5.624 -11.68,7.053c-3.731,1.179 -8.631,1.677 -12.666,1.291Zm-22.943,-13.968c-2.919,-4.479 -4.394,-8.888 -5.105,-15.264c-0.236,-2.106 -0.153,-3.31 0.533,-7.632c0.853,-5.382 3.92,-11.615 7.607,-15.448c1.569,-1.629 1.709,-1.672 3.623,-1.025c2.32,0.785 4.8,2.499 8.647,5.978l2.248,2.032l-1.229,1.505c-5.693,6.99 -11.702,16.902 -13.964,23.033c-1.229,3.331 -1.724,6.677 -1.193,8.069c0.357,0.941 0.029,0.591 -1.171,-1.246l0.004,-0.002Zm51.239,0.761c0.288,-1.408 -0.077,-3.993 -0.931,-6.601c-1.851,-5.647 -8.04,-16.152 -13.722,-23.296l-1.789,-2.248l1.936,-1.777c2.527,-2.32 4.281,-3.709 6.175,-4.89c1.493,-0.931 3.627,-1.755 4.545,-1.755c0.565,0 2.557,2.073 4.164,4.328c2.491,3.491 4.322,7.731 5.25,12.138c0.6,2.851 0.65,8.945 0.097,11.789c-0.459,2.333 -1.419,5.357 -2.349,7.409c-0.706,1.536 -2.444,4.522 -3.208,5.494c-0.392,0.499 -0.392,0.498 -0.174,-0.579l0.006,-0.012Zm-27.78,-41.633c-2.623,-1.331 -6.668,-2.76 -8.902,-3.145c-0.782,-0.135 -2.118,-0.211 -2.967,-0.167c-1.845,0.093 -1.762,-0.003 1.195,-1.4c2.458,-1.162 4.509,-1.845 7.294,-2.43c3.131,-0.658 9.018,-0.665 12.1,-0.016c3.327,0.702 7.246,2.16 9.454,3.52l0.658,0.403l-1.506,-0.075c-2.993,-0.152 -7.355,1.058 -12.039,3.336c-1.412,0.688 -2.64,1.236 -2.73,1.222c-0.089,-0.018 -1.241,-0.579 -2.56,-1.248l0.003,0Z'/%3E%3C/svg%3E">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
    <style>
        .btn .bi {
            height: 1em;
            width: 1em;
            display: inline-block;
            vertical-align: -.125em;
        }
        .feature .bi {
            height: 2rem;
            width: 2rem;
        }
    </style>
</head>
<body>

<header class="bg-dark py-5">
    <div class="container px-5">
        <div class="row gx-5 justify-content-center">
            <div class="col-lg-6">
                <div class="text-center my-5">
                    <h1 class="display-5 fw-bolder text-white mb-2">XboxAPI Workers</h1>
                    <p class="lead text-white-50 mb-4">
                        A fast and simple Xbox Live API, built on
                        <a href="https://workers.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Workers</a>
                        and <a href="https://www.cloudflare.com/products/workers-kv/" target="_blank" rel="noopener">Cloudflare Workers KV</a>.
                    </p>
                    <div class="d-grid gap-3 d-sm-flex justify-content-sm-center">
                        <a class="btn btn-primary btn-lg" href="https://github.com/MrMicky-FR/XboxAPI-Workers">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                            </svg>
                            GitHub repo
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>

<section class="py-5" id="features">
    <div class="container px-5 my-5">
        <div class="row gx-5">
            <div class="col-lg-4 mb-5 mb-lg-0">
                <div class="feature d-inline-block bg-primary bg-gradient text-white rounded-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightning-charge m-4" viewBox="0 0 16 16">
                        <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09zM4.157 8.5H7a.5.5 0 0 1 .478.647L6.11 13.59l5.732-6.09H9a.5.5 0 0 1-.478-.647L9.89 2.41 4.157 8.5z"/>
                    </svg>
                </div>
                <h2 class="h4 fw-bolder">Fast</h2>
                <p>Running on more than 200 datacenters worldwide thanks to the power of <a href="https://workers.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Workers</a>.</p>
            </div>
            <div class="col-lg-4 mb-5 mb-lg-0">
                <div class="feature d-inline-block bg-primary bg-gradient text-white rounded-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star m-4" viewBox="0 0 16 16">
                        <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                    </svg>
                </div>
                <h2 class="h4 fw-bolder">Easy to use</h2>
                <p>A profile can be fetched with a single GET request.</p>
            </div>
            <div class="col-lg-4">
                <div class="feature d-inline-block bg-primary bg-gradient text-white rounded-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-code-slash m-4" viewBox="0 0 16 16">
                        <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
                    </svg>
                </div>
                <h2 class="h4 fw-bolder">Open source</h2>
                <p>The code source is available on <a href="https://github.com/MrMicky-FR/XboxAPI-Workers">GitHub</a> under the MIT license.</p>
            </div>
        </div>
    </div>
</section>

<section class="py-5 bg-light">
    <div class="container px-5 my-5 text-center">
        <h2 class="fw-bolder mb-5">Get started</h2>
        <div class="row justify-content-center">
            <div class="col-lg-6">
                <p class="lead">
                    You can find more information on <a href="https://github.com/MrMicky-FR/XboxAPI-Workers">GitHub</a>.
                </p>
            </div>
        </div>
    </div>
</section>

<footer class="py-5 bg-dark">
    <div class="container px-5">
        <p class="m-0 text-center text-white">Copyright &copy; {year} MrMicky</p>
    </div>
</footer>

</body>
</html>`
