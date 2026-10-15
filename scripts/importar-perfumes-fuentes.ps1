[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [uri]$ApiUrl
)

$ErrorActionPreference = "Stop"
if ($ApiUrl.Scheme -ne "https" -and $ApiUrl.Host -notin @("localhost", "127.0.0.1", "::1")) {
    throw "Usa HTTPS para proteger las credenciales del administrador."
}
if ($ApiUrl.AbsolutePath.TrimEnd("/") -notlike "*/api") {
    throw "ApiUrl debe ser la URL base del backend y terminar en /api."
}
$baseUrl = $ApiUrl.AbsoluteUri.TrimEnd("/")
$usuario = Read-Host "Usuario administrador"
$claveSegura = Read-Host "Contraseña de administrador" -AsSecureString
$clave = [System.Net.NetworkCredential]::new("", $claveSegura).Password
$auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${usuario}:${clave}"))
$headers = @{ Authorization = "Basic $auth" }
$stockInicial = 10

$catalogo = @(
    @{ marca = "Chanel"; nombre = "Bleu de Chanel L'Exclusif"; genero = "Masculino"; concentracion = "Parfum"; mililitros = $null; precio = 869.00 },
    @{ marca = "Chanel"; nombre = "Bleu de Chanel Eau de Parfum"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 649.00 },
    @{ marca = "Chanel"; nombre = "Bleu de Chanel Parfum"; genero = "Masculino"; concentracion = "Parfum"; mililitros = $null; precio = 649.00 },
    @{ marca = "Chanel"; nombre = "Bleu de Chanel Eau de Toilette"; genero = "Masculino"; concentracion = "Eau de Toilette"; mililitros = $null; precio = 429.00 },
    @{ marca = "Chanel"; nombre = "Bleu de Chanel Twist and Spray Eau de Toilette"; genero = "Masculino"; concentracion = "Eau de Toilette"; mililitros = $null; precio = 489.00 },
    @{ marca = "Chanel"; nombre = "Bleu de Chanel Twist and Spray Eau de Parfum"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = $null; precio = 549.00 },
    @{ marca = "Chanel"; nombre = "Bleu de Chanel Twist and Spray Parfum"; genero = "Masculino"; concentracion = "Parfum"; mililitros = $null; precio = 679.00 },
    @{ marca = "Chanel"; nombre = "Chance Eau Splendide"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = $null; precio = 599.00 },
    @{ marca = "Chanel"; nombre = "Chance Eau Fraîche"; genero = "Femenino"; concentracion = "Eau de Toilette"; mililitros = $null; precio = 199.00 },
    @{ marca = "Chanel"; nombre = "Chance Eau Fraîche"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = $null; precio = 599.00 },
    @{ marca = "Chanel"; nombre = "Chance Eau Vive"; genero = "Femenino"; concentracion = "Eau de Toilette"; mililitros = $null; precio = 479.00 },
    @{ marca = "Chanel"; nombre = "Chance"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = $null; precio = 599.00 },
    @{ marca = "Chanel"; nombre = "Chance Eau Tendre"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = $null; precio = 599.00 },
    @{ marca = "Chanel"; nombre = "Coco Mademoiselle Intense"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = $null; precio = 619.00 },
    @{ marca = "Chanel"; nombre = "N°5 L'Eau"; genero = "Femenino"; concentracion = "Eau de Toilette"; mililitros = $null; precio = 589.00 },
    @{ marca = "Chanel"; nombre = "N°5 Eau Première"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 699.00 },
    @{ marca = "Parfums De Marly"; nombre = "Althair"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Layton Exclusif"; genero = "Masculino"; concentracion = "Parfum"; mililitros = 125; precio = 1735.00 },
    @{ marca = "Parfums De Marly"; nombre = "Delina Exclusif"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 30; precio = 979.00 },
    @{ marca = "Parfums De Marly"; nombre = "Herod"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Percival"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Oajan"; genero = "Unisex"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1509.00 },
    @{ marca = "Parfums De Marly"; nombre = "Athénais"; genero = "Femenino"; concentracion = "Parfum"; mililitros = 75; precio = 1549.00 },
    @{ marca = "Parfums De Marly"; nombre = "Valero"; genero = "Unisex"; concentracion = "Extrait de Parfum"; mililitros = 100; precio = 2069.00 },
    @{ marca = "Parfums De Marly"; nombre = "Eragon"; genero = "Unisex"; concentracion = "Extrait de Parfum"; mililitros = 100; precio = 2069.00 },
    @{ marca = "Parfums De Marly"; nombre = "Carios"; genero = "Unisex"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 2069.00 },
    @{ marca = "Parfums De Marly"; nombre = "Layton"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Pegasus"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Haltane"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1735.00 },
    @{ marca = "Parfums De Marly"; nombre = "Perseus"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 125; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Delina"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 75; precio = 1535.00 },
    @{ marca = "Parfums De Marly"; nombre = "Delina Exclusif"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 75; precio = 1615.00 },
    @{ marca = "Parfums De Marly"; nombre = "Delina La Rosée"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 75; precio = 1495.00 },
    @{ marca = "Parfums De Marly"; nombre = "Oriana"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 75; precio = 1535.00 },
    @{ marca = "Parfums De Marly"; nombre = "Valaya"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 75; precio = 1535.00 },
    @{ marca = "Gucci"; nombre = "Guilty Pour Homme"; genero = "Masculino"; concentracion = "Eau de Toilette"; mililitros = 100; precio = 356.00 },
    @{ marca = "Tom Ford"; nombre = "Black Orchid"; genero = "Unisex"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 599.00 },
    @{ marca = "Givenchy"; nombre = "Gentleman Society"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 619.00 },
    @{ marca = "Dolce & Gabbana"; nombre = "Light Blue Pour Homme"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 599.00 },
    @{ marca = "Hugo Boss"; nombre = "Boss Bottled"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 495.00 },
    @{ marca = "Lancome"; nombre = "La Vie Est Belle"; genero = "Femenino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 619.00 },
    @{ marca = "Bvlgari"; nombre = "Man in Black"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 549.00 },
    @{ marca = "Burberry"; nombre = "Hero"; genero = "Masculino"; concentracion = "Eau de Toilette"; mililitros = 100; precio = 499.00 },
    @{ marca = "Creed"; nombre = "Aventus"; genero = "Masculino"; concentracion = "Eau de Parfum"; mililitros = 100; precio = 2059.00 },
    @{ marca = "Jo Malone"; nombre = "Lime Basil & Mandarin"; genero = "Unisex"; concentracion = "Cologne"; mililitros = 100; precio = 539.00 },
    @{ marca = "Jean Paul Gaultier"; nombre = "Le Male"; genero = "Masculino"; concentracion = "Eau de Toilette"; mililitros = 125; precio = 479.00 }
)

function Normalizar-Nombre([string]$valor) {
    $normalizado = $valor.Normalize([Text.NormalizationForm]::FormD)
    return ([regex]::Replace($normalizado, "\p{Mn}", "") -replace "[^a-zA-Z0-9]+", " ").Trim().ToLowerInvariant()
}

try {
    $marcas = @(Invoke-RestMethod -Uri "$baseUrl/marcas" -Headers $headers)
    $perfumes = @(Invoke-RestMethod -Uri "$baseUrl/perfumes" -Headers $headers)
    $nuevasMarcas = @{}

    foreach ($item in $catalogo) {
        if ($null -eq $item.mililitros) {
            Write-Host "Omitido por tamaño no confirmado: $($item.marca) $($item.nombre)"
            continue
        }

        $marca = $marcas | Where-Object { $_.nombre -ieq $item.marca } | Select-Object -First 1
        if ($null -eq $marca) {
            if (-not $nuevasMarcas.ContainsKey($item.marca)) {
                if ($WhatIfPreference) {
                    $nuevasMarcas[$item.marca] = @{ id = -1; nombre = $item.marca }
                    Write-Host "Se crearía la marca: $($item.marca)"
                }
                else {
                    $marcaNueva = Invoke-RestMethod -Uri "$baseUrl/marcas" -Method Post `
                        -Headers $headers -ContentType "application/json; charset=utf-8" `
                        -Body (@{ nombre = $item.marca; estado = $true } | ConvertTo-Json)
                    $nuevasMarcas[$item.marca] = $marcaNueva
                    $marcas += $marcaNueva
                    Write-Host "Marca creada: $($item.marca)"
                }
            }
            $marca = $nuevasMarcas[$item.marca]
        }

        $nombreNormalizado = Normalizar-Nombre $item.nombre
        $existente = $perfumes | Where-Object {
            $_.idMarca -eq $marca.id `
                -and (Normalizar-Nombre $_.nombre) -eq $nombreNormalizado `
                -and (Normalizar-Nombre $_.concentracion) -eq (Normalizar-Nombre $item.concentracion) `
                -and $_.mililitros -eq $item.mililitros
        } | Select-Object -First 1

        if ($null -ne $existente) {
            Write-Host "Ya existe, se omite: $($item.marca) $($item.nombre)"
            continue
        }

        $producto = @{
            idMarca = $marca.id
            nombre = $item.nombre
            genero = $item.genero
            concentracion = $item.concentracion
            mililitros = $item.mililitros
            precio = $item.precio
            stock = $stockInicial
        }
        $descripcion = "$($item.marca) $($item.nombre) · S/ $($item.precio) · $stockInicial unidades"
        if ($PSCmdlet.ShouldProcess($descripcion, "Agregar perfume al catálogo")) {
            try {
                $creado = Invoke-RestMethod -Uri "$baseUrl/perfumes" -Method Post `
                    -Headers $headers -ContentType "application/json; charset=utf-8" `
                    -Body ($producto | ConvertTo-Json -Depth 5 -Compress)
            }
            catch {
                $respuesta = $_.Exception.Response
                if ($respuesta -is [System.Net.HttpWebResponse]) {
                    $lector = [System.IO.StreamReader]::new($respuesta.GetResponseStream())
                    try {
                        $detalle = $lector.ReadToEnd().Trim()
                    }
                    finally {
                        $lector.Dispose()
                    }
                    throw "No se pudo agregar '$($item.marca) $($item.nombre)' (HTTP $([int]$respuesta.StatusCode)): $detalle"
                }
                throw "No se pudo agregar '$($item.marca) $($item.nombre)': $($_.Exception.Message)"
            }
            $perfumes += $creado
            Write-Host "Agregado: $descripcion"
        }
        else {
            Write-Host "Pendiente de agregar: $descripcion"
        }
    }
}
finally {
    $clave = $null
    $auth = $null
    $headers = $null
    $claveSegura.Dispose()
}
